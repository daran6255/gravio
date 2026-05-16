from datetime import datetime
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from app.utils.activity_tracker import log_create, log_update

from app.api import deps
from app.models.ticket import Ticket, TicketMessage, TicketStatus, TicketPriority, TicketCategory
from app.models.user import User, UserRole
from app.schemas.ticket import Ticket as TicketSchema, TicketCreate, TicketUpdate, TicketMessage as TicketMessageSchema, TicketMessageCreate

router = APIRouter(prefix="/tickets", tags=["Tickets"])


async def generate_ticket_number(db: AsyncSession) -> str:
    """Generate a unique ticket number like WV-TKT-2026-0001"""
    year = datetime.now().year
    prefix = f"WV-TKT-{year}-"
    
    # Get the latest ticket for this year
    query = select(Ticket).filter(Ticket.ticket_number.like(f"{prefix}%")).order_by(Ticket.id.desc())
    result = await db.execute(query)
    last_ticket = result.scalars().first()
    
    if not last_ticket:
        new_id = 1
    else:
        try:
            last_id_str = last_ticket.ticket_number.split("-")[-1]
            new_id = int(last_id_str) + 1
        except (ValueError, IndexError):
            new_id = 1
            
    return f"{prefix}{new_id:04d}"


@router.post("/", response_model=TicketSchema)
async def create_ticket(
    *,
    db: AsyncSession = Depends(deps.get_db),
    request: Request,
    ticket_in: TicketCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Create new ticket."""
    ticket_number = await generate_ticket_number(db)
    
    ticket = Ticket(
        **ticket_in.model_dump(),
        ticket_number=ticket_number,
        user_id=current_user.id,
        status=TicketStatus.OPEN
    )
    db.add(ticket)
    await db.commit()
    
    # Re-fetch with selectinload to avoid lazy-loading issues
    query = select(Ticket).where(Ticket.id == ticket.id).options(selectinload(Ticket.messages))
    result = await db.execute(query)
    ticket_obj = result.scalars().first()
    
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="ticket",
        resource_id=ticket_obj.id,
        created_object=ticket_obj
    )
    
    return ticket_obj


@router.get("/", response_model=List[TicketSchema])
async def read_tickets(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Retrieve tickets."""
    if current_user.is_superuser or current_user.role == UserRole.ADMIN:
        query = select(Ticket).options(selectinload(Ticket.messages)).offset(skip).limit(limit)
    else:
        query = select(Ticket).filter(Ticket.user_id == current_user.id).options(selectinload(Ticket.messages)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    tickets = result.scalars().all()
    return tickets


@router.get("/{id}", response_model=TicketSchema)
async def read_ticket(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Get ticket by ID."""
    result = await db.execute(select(Ticket).filter(Ticket.id == id).options(selectinload(Ticket.messages)))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if not current_user.is_superuser and current_user.role != UserRole.ADMIN and ticket.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return ticket


@router.patch("/{id}", response_model=TicketSchema)
async def update_ticket(
    *,
    db: AsyncSession = Depends(deps.get_db),
    request: Request,
    id: int,
    ticket_in: TicketUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Update a ticket."""
    result = await db.execute(select(Ticket).filter(Ticket.id == id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Only admins can update status
    if ticket_in.status and not current_user.is_superuser and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Only admins can update ticket status")
        
    if not current_user.is_superuser and current_user.role != UserRole.ADMIN and ticket.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    update_data = ticket_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(ticket, field, update_data[field])
        
    db.add(ticket)
    await db.commit()
    
    # Re-fetch with selectinload to avoid lazy-loading issues
    query = select(Ticket).where(Ticket.id == id).options(selectinload(Ticket.messages))
    result = await db.execute(query)
    updated_ticket = result.scalars().first()
    
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="ticket",
        resource_id=id,
        before=ticket,
        after=updated_ticket
    )
    
    return updated_ticket


@router.post("/{id}/messages", response_model=TicketMessageSchema)
async def create_ticket_message(
    *,
    db: AsyncSession = Depends(deps.get_db),
    request: Request,
    id: int,
    message_in: TicketMessageCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """Add a message to a ticket conversation."""
    result = await db.execute(select(Ticket).filter(Ticket.id == id))
    ticket = result.scalars().first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if not current_user.is_superuser and current_user.role != UserRole.ADMIN and ticket.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
        
    message = TicketMessage(
        **message_in.model_dump(),
        ticket_id=id,
        user_id=current_user.id
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    await log_create(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="ticket_message",
        resource_id=message.id,
        created_object=message
    )
    
    return message

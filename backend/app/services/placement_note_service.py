from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_note import PlacementNote
from app.repositories.placement_note_repository import PlacementNoteRepository
from app.schemas.placement_note import PlacementNoteCreate, PlacementNoteUpdate


class PlacementNoteService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = PlacementNoteRepository(db)

    async def add_note(self, note_in: PlacementNoteCreate) -> PlacementNote:
        # Automatically populate candidate_id and job_role_id if missing but mapping_id is provided
        if note_in.mapping_id and (not note_in.candidate_id or not note_in.job_role_id):
            from app.services.placement_mapping_service import PlacementMappingService
            mapping_service = PlacementMappingService(self.db)
            mapping = await mapping_service.repository.get(note_in.mapping_id)
            if mapping:
                note_in.candidate_id = note_in.candidate_id or mapping.candidate_id
                note_in.job_role_id = note_in.job_role_id or mapping.job_role_id

        note = PlacementNote(**note_in.model_dump())
        self.db.add(note)
        await self.db.commit()
        await self.db.refresh(note)
        
        # Load created_by relationship for the response
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        stmt = select(PlacementNote).where(PlacementNote.id == note.id).options(selectinload(PlacementNote.created_by))
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def update_note(self, id: int, note_in: PlacementNoteUpdate) -> Optional[PlacementNote]:
        note = await self.repository.get(id)
        if not note:
            return None
        
        update_data = note_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(note, key, value)
        
        note.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(note)
        return note

    async def get_by_mapping(self, mapping_id: int) -> List[PlacementNote]:
        return await self.repository.get_by_mapping(mapping_id)

    async def get_by_candidate(self, candidate_id: int) -> List[PlacementNote]:
        return await self.repository.get_by_candidate(candidate_id)

    async def delete_note(self, id: int) -> bool:
        note = await self.repository.get(id)
        if not note:
            return False
        
        note.is_deleted = True
        note.deleted_at = datetime.utcnow()
        await self.db.commit()
        return True

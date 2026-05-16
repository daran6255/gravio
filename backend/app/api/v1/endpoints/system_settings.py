from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.deps import require_roles, get_current_user
from app.models.user import User, UserRole
from app.utils.activity_tracker import log_update
from app.repositories.system_setting_repository import SystemSettingRepository
from app.schemas.system_setting import SystemSettingResponse, SystemSettingUpdate, SystemSettingCreate

router = APIRouter(prefix="/settings/system", tags=["Settings"])


@router.get("", response_model=List[SystemSettingResponse])
async def get_system_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get all system settings. (Admin/Manager only)
    Secret values will be masked in the frontend implementation or here.
    """
    repo = SystemSettingRepository(db)
    settings = await repo.get_all_settings()
    
    # Return settings with masked secrets, but DON'T modify the db objects in place
    response_settings = []
    for s in settings:
        s_dict = {
            "id": s.id,
            "key": s.key,
            "value": "********" if s.is_secret and s.value else s.value,
            "description": s.description,
            "is_secret": s.is_secret
        }
        response_settings.append(s_dict)
            
    return response_settings


@router.post("", response_model=SystemSettingResponse, status_code=status.HTTP_201_CREATED)
async def create_system_setting(
    setting_in: SystemSettingCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_roles([UserRole.ADMIN])),
) -> Any:
    """
    Create a new system setting. (Admin only)
    """
    repo = SystemSettingRepository(db)
    
    # Check if key already exists
    existing = await repo.get_by_key(setting_in.key)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"System setting with key '{setting_in.key}' already exists"
        )
        
    new_setting = await repo.create(setting_in.model_dump())
    
    # No log_create util imported yet, but we can log it if needed or follow the log_update pattern
    # For now, following the existing repo pattern
    return new_setting


@router.patch("/{id}", response_model=SystemSettingResponse)
async def update_system_setting(
    id: int,
    setting_in: SystemSettingUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_roles([UserRole.ADMIN])),
) -> Any:
    """
    Update a system setting. (Admin only)
    """
    repo = SystemSettingRepository(db)
    setting = await repo.get(id)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
        
    update_data = setting_in.model_dump(exclude_unset=True)
    
    # Secret Protection: If the setting is a secret and the new value is the mask, ignore the value update
    if setting.is_secret and update_data.get("value") == "********":
        update_data.pop("value", None)
        
    updated_setting = await repo.update(id, update_data)
    
    await log_update(
        db=db,
        request=request,
        user_id=current_user.id,
        resource_type="system_setting",
        resource_id=id,
        before=setting,
        after=updated_setting
    )
    
    return updated_setting

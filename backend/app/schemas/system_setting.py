from typing import Optional
from pydantic import BaseModel, ConfigDict


class SystemSettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    is_secret: bool = False


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    is_secret: Optional[bool] = None


class SystemSettingResponse(SystemSettingBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class SystemSettingUpdateBulk(BaseModel):
    settings: list[SystemSettingUpdate]

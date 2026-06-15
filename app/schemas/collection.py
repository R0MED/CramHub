from pydantic import BaseModel
from typing import Optional


class CollectionCreate(BaseModel):
    title: str
    description: Optional[str] = None


class CollectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class CollectionResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    is_public: bool

    class Config:
        from_attributes = True
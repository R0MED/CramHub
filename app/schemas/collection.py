from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CollectionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: Optional[bool] = False 

class CollectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None  
class CollectionResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    user_id: int
    is_public: bool         
    created_at: datetime

    class Config:
        from_attributes = True
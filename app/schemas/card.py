from pydantic import BaseModel
from typing import Optional


class CardCreate(BaseModel):
    front: str
    back: str
    difficulty: Optional[int] = 1


class CardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    difficulty: Optional[int] = None


class CardResponse(BaseModel):
    id: int
    collection_id: int
    front: str
    back: str
    difficulty: int

    class Config:
        from_attributes = True
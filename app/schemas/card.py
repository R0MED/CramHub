from pydantic import BaseModel
from typing import Optional
from datetime import date

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

class CardReview(BaseModel):
    quality: int
    time_spent_ms: Optional[int] = 0  # Добавил время, потраченное на ответ (в миллисекундах)

# Схемы для статистики 
class DailyActivityResponse(BaseModel):
    review_date: date
    cards_reviewed: int
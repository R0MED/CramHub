from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Card, Collection
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])


@router.post("/")
def create_card(collection_id: int, front: str, back: str, difficulty: int = 1, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    collection = (db.query(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    card = Card(collection_id=collection_id, front=front, back=back, difficulty=difficulty)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.get("/collection/{collection_id}")
def get_cards(collection_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    collection = (db.query(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return db.query(Card).filter(Card.collection_id == collection_id).all()
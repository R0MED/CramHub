from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Card, Collection
from app.schemas.card import CardCreate, CardUpdate, CardResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])


@router.post("/", response_model=CardResponse)
def create_card(collection_id: int, card_data: CardCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user),):
    collection = (db.query(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    card = Card(collection_id=collection_id, front=card_data.front, back=card_data.back, difficulty=card_data.difficulty,)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.get("/collection/{collection_id}", response_model=list[CardResponse])
def get_cards(collection_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user),):
    collection = (db.query(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return db.query(Card).filter(Card.collection_id == collection_id).all()


@router.put("/{card_id}", response_model=CardResponse)
def update_card(card_id: int, card_data: CardUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user),):
    card = (db.query(Card).join(Collection).filter(Card.id == card_id, Collection.user_id == current_user.id).first())
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if card_data.front is not None:
        card.front = card_data.front
    if card_data.back is not None:
        card.back = card_data.back
    if card_data.difficulty is not None:
        card.difficulty = card_data.difficulty
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user),):
    card = (db.query(Card).join(Collection).filter(Card.id == card_id,Collection.user_id == current_user.id).first())
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": "Card deleted successfully"}
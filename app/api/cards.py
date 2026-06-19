from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date
from app.db.database import get_db
from app.models.models import Card, Collection, ReviewLog
from app.schemas.card import CardCreate, CardUpdate, CardResponse, CardReview, DailyActivityResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/cards", tags=["cards"])

@router.post("/", response_model=CardResponse)
def create_card(collection_id: int, card_data: CardCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    collection = (db.query(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    card = Card(collection_id=collection_id, front=card_data.front, back=card_data.back, difficulty=card_data.difficulty)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card

@router.get("/collection/{collection_id}", response_model=list[CardResponse])
def get_cards(collection_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    collection = (db.query(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    return db.query(Card).filter(Card.collection_id == collection_id, Card.is_deleted == False).all()

@router.put("/{card_id}", response_model=CardResponse)
def update_card(card_id: int, card_data: CardUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    card = (db.query(Card).join(Collection).filter(Card.id == card_id, Collection.user_id == current_user.id, Card.is_deleted == False).first())
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
def delete_card(card_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    card = (db.query(Card).join(Collection).filter(Card.id == card_id,Collection.user_id == current_user.id).first())
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card.is_deleted = True
    db.commit()
    return {"message": "Card deleted successfully"}



@router.get("/review/{collection_id}", response_model=list[CardResponse])
def get_cards_for_review(collection_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    collection = db.query(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    now = datetime.utcnow()
    cards = db.query(Card).filter(Card.collection_id == collection_id, Card.next_review_date <= now, Card.is_deleted == False).all()
    return cards

@router.post("/{card_id}/review", response_model=CardResponse)
def review_card(card_id: int, review: CardReview, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    card = db.query(Card).join(Collection).filter(Card.id == card_id, Collection.user_id == current_user.id, Card.is_deleted == False).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    quality = review.quality
    if quality < 0 or quality > 5:
        raise HTTPException(status_code=400, detail="Оценка должна быть от 0 до 5")
    
    new_log = ReviewLog(
        user_id=current_user.id,
        card_id=card.id,
        quality=quality,
        time_spent_ms=review.time_spent_ms
    )
    db.add(new_log)

    if quality >= 3:
        if card.repetition == 0:
            card.interval = 1
        elif card.repetition == 1:
            card.interval = 6
        else:
            card.interval = int(card.interval * card.easiness_factor)
        card.repetition += 1
    else:
        card.repetition = 0
        card.interval = 1
    
    card.easiness_factor = card.easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if card.easiness_factor < 1.3:
        card.easiness_factor = 1.3
        
    card.next_review_date = datetime.utcnow() + timedelta(days=card.interval)
    
    db.commit()
    db.refresh(card)
    return card


# ЭНДПОИНТЫ ДЛЯ СТАТИСТИКИ

@router.get("/statistics/summary")
def get_statistics_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    logs_query = db.query(ReviewLog).filter(ReviewLog.user_id == current_user.id)
    total_reviews = logs_query.count()
    
    if total_reviews == 0:
        return {
            "total_reviews": 0,
            "correct_rate_percent": 0.0,
            "average_time_spent_sec": 0.0
        }
    
    correct_reviews = logs_query.filter(ReviewLog.quality >= 3).count()
    correct_rate = round((correct_reviews / total_reviews) * 100, 1)
    
    avg_time_ms = db.query(func.avg(ReviewLog.time_spent_ms)).filter(ReviewLog.user_id == current_user.id).scalar() or 0
    avg_time_sec = round(avg_time_ms / 1000, 2)
    
    return {
        "total_reviews": total_reviews,
        "correct_rate_percent": correct_rate,
        "average_time_spent_sec": avg_time_sec
    }

@router.get("/statistics/activity", response_model=list[DailyActivityResponse])
def get_daily_activity(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    activity = (
        db.query(
            ReviewLog.review_date,
            func.count(ReviewLog.id).label("cards_reviewed")
        )
        .filter(ReviewLog.user_id == current_user.id)
        .group_by(ReviewLog.review_date)
        .order_by(ReviewLog.review_date.desc())
        .limit(30)
        .all()
    )
    
    result = [{"review_date": item.review_date, "cards_reviewed": item.cards_reviewed} for item in activity]
    return result
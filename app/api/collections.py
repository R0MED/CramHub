from fastapi import APIRouter
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import (User, Collection)
from app.schemas.collection import (CollectionCreate, CollectionResponse)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/collections", tags=["collections"])


@router.post("", response_model=CollectionResponse)
def create_collection(collection: CollectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_collection = Collection(title=collection.title, description=collection.description, user_id=current_user.id)
    db.add(new_collection)
    db.commit()
    db.refresh(new_collection)
    return new_collection


@router.get("", response_model=list[CollectionResponse])
def get_collections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    collections = (db.query(Collection).filter(Collection.user_id == current_user.id).all())
    return collections
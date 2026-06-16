from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import (User, Collection)
from app.schemas.collection import (CollectionCreate, CollectionUpdate, CollectionResponse)
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


@router.get("/{collection_id}", response_model=CollectionResponse)
def get_collection(collection_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    collection = (db.query(Collection).filter(Collection.id == collection_id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if collection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return collection


@router.put("/{collection_id}", response_model=CollectionResponse)
def update_collection(collection_id: int, collection_data: CollectionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    collection = (db.query(Collection).filter(Collection.id == collection_id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if collection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    update_data = collection_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(collection, key, value)
    db.commit()
    db.refresh(collection)
    return collection


@router.delete("/{collection_id}")
def delete_collection(collection_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    collection = (db.query(Collection).filter(Collection.id == collection_id).first())
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    if collection.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(collection)
    db.commit()
    return {"message": "Collection deleted"}
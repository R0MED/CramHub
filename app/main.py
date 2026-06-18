from fastapi import Depends
from app.models.models import User
from app.core.dependencies import get_current_user
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine
from app.models.models import Base
from app.api.auth import router as auth_router
from app.api.collections import (router as collections_router)
from app.api.cards import router as cards_router
from app.schemas.auth import UserResponse
from app.schemas.auth import UserUpdate
from app.db.database import get_db
from sqlalchemy.orm import Session


Base.metadata.create_all(bind=engine)

app = FastAPI(title="CramHub")

origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(collections_router)
app.include_router(cards_router)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@app.put("/me", response_model=UserResponse)
def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_data.username is not None and user_data.username != current_user.username:
        if db.query(User).filter(User.username == user_data.username).first():
            raise HTTPException(status_code=400, detail="Username already exists")
        current_user.username = user_data.username

    if user_data.email is not None and user_data.email != current_user.email:
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=400, detail="Email already exists")
        current_user.email = user_data.email

    db.commit()
    db.refresh(current_user)
    return current_user

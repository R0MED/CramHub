from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.models import User
from app.core.dependencies import get_current_user
from app.db.database import engine
from app.models.models import Base
from app.api.auth import router as auth_router
from app.api.collections import router as collections_router
from app.api.cards import router as cards_router
from app.schemas.auth import UserResponse
from app.schemas.auth import UserUpdate
from app.db.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CramHub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    if user_data.username is not None:
        current_user.username = user_data.username

    if user_data.email is not None:
        current_user.email = user_data.email

    db.commit()
    db.refresh(current_user)

    return current_user
    

@app.get("/update-db")
def update_database():
    queries = [
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS interval INTEGER DEFAULT 0;",
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS repetition INTEGER DEFAULT 0;",
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS easiness_factor FLOAT DEFAULT 2.5;",
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;" # <-- Добавили новую колонку
    ]
    with engine.connect() as conn:
        for query in queries:
            try:
                conn.execute(text(query))
                conn.commit()
            except Exception as e:
                print(f"Уже добавлено или ошибка: {e}")
                
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        return {"error": f"Произошла ошибка при создании таблиц: {e}"}
                
    return {"message": "База данных успешно обновлена (Добавлено мягкое удаление)!"}
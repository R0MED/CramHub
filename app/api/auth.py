from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.auth import (UserRegister, UserLogin)
from app.core.security import (hash_password, verify_password, create_access_token)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing_user = (db.query(User).filter(User.email == user.email).first())
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User(username=user.username, email=user.email, password_hash=hash_password(user.password))
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created"}


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = (db.query(User).filter(User.email == user.email).first())
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/token")
def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = (db.query(User).filter(User.email == form_data.username).first())
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(form_data.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(db_user.id)})
    return {"access_token": token, "token_type": "bearer"}
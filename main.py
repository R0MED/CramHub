###
from fastapi import Depends
from app.models.models import User
from app.core.dependencies import get_current_user
###
from fastapi import FastAPI
from app.db.database import engine
from app.models.models import Base
from app.api.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CramHub")
app.include_router(auth_router)


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "username": current_user.username}

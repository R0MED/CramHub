from fastapi import FastAPI

from app.db.database import engine
from app.models.models import Base

from app.api.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CramHub"
)

app.include_router(
    auth_router
)


@app.get("/")
def root():
    return {
        "status": "ok"
    }
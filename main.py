from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import uvicorn
from app.db.database import engine, Base
from app.models.models import *

app = FastAPI(
    title="CramHub",
    description="Платформа для спидрана и изучения карточек",
    version="0.1.0"
)

# Создание таблиц при старте
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"message": "CramHub запущен! 🚀"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float, Date
from sqlalchemy.orm import relationship
from datetime import datetime, date
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    collections = relationship("Collection", back_populates="owner")
    review_logs = relationship("ReviewLog", back_populates="user", cascade="all, delete-orphan")

class Collection(Base):
    __tablename__ = "collections"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="collections")
    cards = relationship("Card", back_populates="collection", cascade="all, delete-orphan")

class Card(Base):
    __tablename__ = "cards"
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"))
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    difficulty = Column(Integer, default=1)
    
    interval = Column(Integer, default=0)
    repetition = Column(Integer, default=0)
    easiness_factor = Column(Float, default=2.5)
    next_review_date = Column(DateTime, default=datetime.utcnow)
    
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    collection = relationship("Collection", back_populates="cards")
    review_logs = relationship("ReviewLog", back_populates="card", cascade="all, delete-orphan")

class ReviewLog(Base):
    __tablename__ = "review_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    card_id = Column(Integer, ForeignKey("cards.id"))
    quality = Column(Integer, nullable=False)
    review_date = Column(Date, default=date.today)
    review_time = Column(DateTime, default=datetime.utcnow)
    time_spent_ms = Column(Integer, default=0)

    user = relationship("User", back_populates="review_logs")
    card = relationship("Card", back_populates="review_logs")
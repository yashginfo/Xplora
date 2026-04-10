from sqlalchemy import Column, Integer, String, DateTime ,ForeignKey ,JSON
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Trip(Base):
    __tablename__ = "trips"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    uuid       = Column(String, unique=True, index=True, nullable=False)
    destination= Column(String, nullable=False)
    from_location = Column(String, nullable=True) 
    plan       = Column(JSON, nullable=False)      # full AI plan stored as JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
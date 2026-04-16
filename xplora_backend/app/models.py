from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, index=True, nullable=False)
    password   = Column(String, nullable=False)
    role       = Column(String, default="user", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Trip(Base):
    __tablename__ = "trips"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    uuid          = Column(String, unique=True, index=True, nullable=False)
    destination   = Column(String, nullable=False)
    from_location = Column(String, nullable=True)
    plan          = Column(JSON, nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id         = Column(Integer, primary_key=True, index=True)
    uuid       = Column(String, unique=True, index=True, nullable=False)
    topic      = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status     = Column(String, default="open")          # "open" | "closed"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(Integer, primary_key=True, index=True)
    room_id    = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    content    = Column(Text, nullable=False)
    is_edited  = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    edited_at  = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
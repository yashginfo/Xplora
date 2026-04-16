from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Any, Optional

# ── User schemas ──────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True

class UserInToken(BaseModel):
    id: int
    name: str
    email: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserInToken

class TokenData(BaseModel):
    email: str | None = None

# ── Trip schemas ──────────────────────────────────────────

class TripSaveRequest(BaseModel):
    plan: Any
    from_location: str | None = None

class TripOut(BaseModel):
    id: int
    uuid: str
    destination: str
    from_location: str | None = None
    plan: Any = None
    created_at: datetime

    class Config:
        from_attributes = True

# ── Chat schemas ──────────────────────────────────────────

class ChatRoomCreate(BaseModel):
    topic: Optional[str] = None

class ChatRoomOut(BaseModel):
    id: int
    uuid: str
    topic: Optional[str]
    status: str
    created_by: int
    created_at: datetime
    creator_name: Optional[str] = None   # joined from users table

    class Config:
        from_attributes = True

class ChatMessageOut(BaseModel):
    id: int
    room_id: int
    sender_id: int
    sender_name: str                     # joined from users table
    sender_role: str                     # "user" | "expert" | "admin"
    content: str
    is_edited: bool
    is_deleted: bool
    edited_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessageEdit(BaseModel):
    content: str



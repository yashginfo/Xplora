from pydantic import BaseModel, EmailStr 
from datetime import datetime
from typing import Any

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

    class Config:
        from_attributes = True

# ✅ New — user object inside token response
class UserInToken(BaseModel):
    id: int
    name: str
    email: str

# ✅ Updated — added user field
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

# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserLogin, Token
from app.utils import hash_password, verify_password, create_access_token
import os
import httpx

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")


# ── Register ───────────────────────────────────────────────
@router.post("/register", response_model=Token, status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": new_user.id, "name": new_user.name, "email": new_user.email}
    }


# ── Login ──────────────────────────────────────────────────
@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": db_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email}
    }


# ── Google OAuth ───────────────────────────────────────────
@router.post("/google", response_model=Token)
async def google_login(payload: dict, db: Session = Depends(get_db)):
    access_token = payload.get("credential")
    email        = payload.get("email")
    name         = payload.get("name")

    if not access_token or not email:
        raise HTTPException(status_code=400, detail="Missing Google credentials")

    # Verify access token is valid by calling Google's userinfo endpoint
    async with httpx.AsyncClient() as http:
        response = await http.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_data = response.json()

    # Double-check email matches
    if google_data.get("email") != email:
        raise HTTPException(status_code=401, detail="Google token email mismatch")

    verified_name  = google_data.get("name") or name or email.split("@")[0]
    verified_email = google_data.get("email")

    # Find or create user
    db_user = db.query(User).filter(User.email == verified_email).first()

    if not db_user:
        db_user = User(
            name=verified_name,
            email=verified_email,
            password=hash_password(os.urandom(32).hex())  # random unusable password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    token = create_access_token(data={"sub": db_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email}
    }
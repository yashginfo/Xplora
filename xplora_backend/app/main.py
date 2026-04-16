from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, trips, surprise, chat
from app import models
from dotenv import load_dotenv
from app.routers import sidebar

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Xplora API")

# ── Middleware (CORS first, then custom) ──────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://xplora-ai.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_coop_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response

# ── Routers ───────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(trips.router, prefix="/trips", tags=["trips"])
app.include_router(surprise.router, prefix="/surprise", tags=["surprise"])
app.include_router(sidebar.router, prefix="/sidebar", tags=["sidebar"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])

@app.get("/")
def root():
    return {"message": "Xplora API is running"}
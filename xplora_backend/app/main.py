# app/main.py — add trips router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, trips  
from app import models          # ✅ import trips
from dotenv import load_dotenv
from app.routers import surprise
from app.routers import sidebar

load_dotenv()


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Xplora API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(trips.router, prefix="/trips", tags=["trips"])  # ✅ register
app.include_router(surprise.router, prefix="/surprise", tags=["surprise"])
app.include_router(sidebar.router, prefix="/sidebar", tags=["sidebar"])

@app.get("/")
def root():
    return {"message": "Xplora API is running"}
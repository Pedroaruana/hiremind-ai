from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.auth_routes import router as auth_router
from app.routes.resume_routes import router as resume_router
from app.routes.cv import router as cv_router

from app.database.connection import engine, Base
from app.models.user_model import User  # garante models carregados

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(cv_router, prefix="/cv", tags=["CV"])


@app.get("/")
def home():
    return {"message": "HireMind AI API is running"}
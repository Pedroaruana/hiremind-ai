from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routes.auth_routes import router as auth_router
from app.routes.cv import router as cv_router

from app.database.connection import engine, Base
from app.models.user_model import User  # garante models carregados

load_dotenv()

# Validação de variáveis críticas na inicialização
if not os.getenv("SECRET_KEY"):
    raise RuntimeError("SECRET_KEY não definida. Configure a variável de ambiente.")
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL não definida. Configure a variável de ambiente.")

app = FastAPI()

ALLOWED_ORIGINS = [
    "https://hiremind-ai-fawn.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(cv_router, prefix="/cv", tags=["CV"])


@app.api_route("/", methods=["GET", "HEAD"])
def home():
    return {"message": "HireMind AI API is running"}
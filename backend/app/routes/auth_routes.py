from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from app.services.jwt_service import create_access_token
from app.database.connection import SessionLocal
from app.models.user_model import User

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterRequest(BaseModel):
    username: str
    password: str

    def validate_fields(self):
        if len(self.username) < 3 or len(self.username) > 50:
            raise HTTPException(status_code=400, detail="Usuário deve ter entre 3 e 50 caracteres.")
        if len(self.password) < 6 or len(self.password) > 128:
            raise HTTPException(status_code=400, detail="Senha deve ter entre 6 e 128 caracteres.")


@router.post("/register")
def register(body: RegisterRequest, db=Depends(get_db)):
    body.validate_fields()
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Usuário já existe.")
    hashed = pwd_context.hash(body.password)
    user = User(username=body.username, password=hashed)
    db.add(user)
    db.commit()
    return {"message": "Usuário criado com sucesso."}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos.")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}
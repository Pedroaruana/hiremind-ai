from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.services.jwt_service import create_access_token

router = APIRouter()

users_db = {}

@router.post("/register")
def register(username: str, password: str):
    users_db[username] = password
    return {"message": "user created"}


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password

    if username not in users_db or users_db[username] != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": username})

    return {
        "access_token": token,
        "token_type": "bearer"
    }
import json
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from typing import Optional
import httpx

from app.database.engine import get_session
from app.repositories.user import UserRepository
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token, decode_access_token
from app.auth.dependencies import get_current_user, get_current_user_id
from app.models.user import User, AuthProvider
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str] = None
    auth_provider: str


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest, session: Session = Depends(get_session)):
    repo = UserRepository(session)
    existing = repo.get_by_email(body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = hash_password(body.password)
    user = repo.create(
        name=body.name,
        email=body.email,
        password_hash=password_hash,
        auth_provider=AuthProvider.EMAIL,
    )
    session.commit()
    token = create_access_token(user.id)
    return AuthResponse(
        token=token,
        user={"id": user.id, "name": user.name, "email": user.email,
              "avatar_url": user.avatar_url, "auth_provider": user.auth_provider.value},
    )


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, session: Session = Depends(get_session)):
    repo = UserRepository(session)
    user = repo.get_by_email(body.email)
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return AuthResponse(
        token=token,
        user={"id": user.id, "name": user.name, "email": user.email,
              "avatar_url": user.avatar_url, "auth_provider": user.auth_provider.value},
    )


@router.post("/google", response_model=AuthResponse)
async def google_auth(body: GoogleAuthRequest, session: Session = Depends(get_session)):
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={body.credential}"
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google credential")
        info = resp.json()

    if info.get("aud") != settings.google_client_id:
        raise HTTPException(status_code=401, detail="Invalid audience")

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Email not provided by Google")

    name = info.get("name", email.split("@")[0])
    avatar_url = info.get("picture")

    repo = UserRepository(session)
    user = repo.get_by_email(email)
    if user:
        if user.auth_provider == AuthProvider.EMAIL and not user.password_hash:
            pass
        token = create_access_token(user.id)
        return AuthResponse(
            token=token,
            user={"id": user.id, "name": user.name, "email": user.email,
                  "avatar_url": user.avatar_url, "auth_provider": user.auth_provider.value},
        )

    user = repo.create(
        name=name,
        email=email,
        auth_provider=AuthProvider.GOOGLE,
        avatar_url=avatar_url,
    )
    session.commit()
    token = create_access_token(user.id)
    return AuthResponse(
        token=token,
        user={"id": user.id, "name": user.name, "email": user.email,
              "avatar_url": user.avatar_url, "auth_provider": user.auth_provider.value},
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user)):
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        auth_provider=user.auth_provider.value,
    )

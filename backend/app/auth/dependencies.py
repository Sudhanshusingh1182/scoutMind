from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.auth.jwt import decode_access_token
from app.database.engine import get_session
from app.repositories.user import UserRepository


async def get_current_user_id(
    authorization: Optional[str] = Header(None),
) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_id


async def get_current_user(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    repo = UserRepository(session)
    user = repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

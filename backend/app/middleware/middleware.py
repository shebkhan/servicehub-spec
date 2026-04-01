from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
from app.services.auth import decode_token
from app.models.models import User
from sqlalchemy.orm import Session
from app.database import SessionLocal


security = HTTPBearer(auto_error=False)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        return response


def get_current_user_from_token(token: str) -> Optional[User]:
    token_data = decode_token(token)
    if not token_data:
        return None
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == token_data.user_id).first()
        return user
    finally:
        db.close()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = None,
    token: Optional[str] = None
) -> User:
    if token is None and credentials:
        token = credentials.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_current_user_from_token(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    return user


async def get_current_active_user(
    credentials: Optional[HTTPAuthorizationCredentials] = None,
    token: Optional[str] = None
) -> User:
    user = await get_current_user(credentials, token)
    return user


def require_role(*roles):
    async def role_checker(
        credentials: Optional[HTTPAuthorizationCredentials] = None,
        token: Optional[str] = None
    ):
        user = await get_current_user(credentials, token)
        if user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return user
    return role_checker

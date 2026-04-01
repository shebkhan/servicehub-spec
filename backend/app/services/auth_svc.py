from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.config import settings
from app.models.models import UserRole, TokenPayload

ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a password using argon2."""
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": int(expire.timestamp()),
        "iat": int(datetime.utcnow().timestamp()),
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT refresh token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": int(expire.timestamp()),
        "iat": int(datetime.utcnow().timestamp()),
        "type": "refresh"
    })
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenPayload]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        sub: str = payload.get("sub")
        role: str = payload.get("role")
        token_type: str = payload.get("type", "access")
        tenant_id: Optional[str] = payload.get("tenant_id")
        
        if sub is None:
            return None
        
        return TokenPayload(
            sub=sub,
            role=UserRole(role) if role else UserRole.CUSTOMER,
            tenant_id=tenant_id,
            type=token_type,
            exp=payload.get("exp", 0),
            iat=payload.get("iat", 0)
        )
    except JWTError:
        return None


def create_tokens(user_id: str, email: str, role: UserRole, tenant_id: Optional[str] = None) -> dict:
    """Create access and refresh tokens for a user."""
    access_token = create_access_token(
        data={"sub": user_id, "email": email, "role": role.value, "tenant_id": tenant_id}
    )
    refresh_token = create_refresh_token(
        data={"sub": user_id, "email": email, "tenant_id": tenant_id}
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

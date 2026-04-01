from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import UserCreate, UserUpdate, UserResponse
from app.models.models import User, UserRole
from app.middleware.middleware import get_current_user, security
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = await get_current_user(credentials, db=db)
    return user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_data: UserUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user = await get_current_user(credentials, db=db)

    if user_data.email:
        existing = db.query(User).filter(User.email == user_data.email, User.id != user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user.email = user_data.email
    if user_data.full_name:
        user.full_name = user_data.full_name
    if user_data.phone:
        user.phone = user_data.phone
    if user_data.is_active is not None:
        user.is_active = user_data.is_active

    db.commit()
    db.refresh(user)
    return user


@router.get("/", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import ProviderCreate, ProviderUpdate, ProviderResponse
from app.models.models import Provider, User, UserRole
from app.middleware.middleware import get_current_user, security
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/providers", tags=["Providers"])


@router.post("/", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_provider(
    provider_data: ProviderCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    user = db.query(User).filter(User.id == provider_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Provider).filter(Provider.user_id == provider_data.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Provider profile already exists")

    if current_user.role != UserRole.ADMIN and current_user.id != provider_data.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    provider = Provider(**provider_data.model_dump())
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


@router.get("/", response_model=List[ProviderResponse])
async def list_providers(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Provider).filter(Provider.is_active == True)
    if category_id:
        query = query.filter(Provider.categories.any(id=category_id))
    providers = query.offset(skip).limit(limit).all()
    return providers


@router.get("/{provider_id}", response_model=ProviderResponse)
async def get_provider(
    provider_id: int,
    db: Session = Depends(get_db)
):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.put("/{provider_id}", response_model=ProviderResponse)
async def update_provider(
    provider_id: int,
    provider_data: ProviderUpdate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if current_user.role != UserRole.ADMIN and current_user.id != provider.user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = provider_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(provider, field, value)

    db.commit()
    db.refresh(provider)
    return provider


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    db.delete(provider)
    db.commit()

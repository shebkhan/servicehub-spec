from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.schemas import TenantCreate, TenantUpdate, TenantResponse
from app.models.models import Tenant, UserRole
from app.middleware.middleware import get_current_user, security
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    existing = db.query(Tenant).filter(Tenant.email == tenant_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    tenant = Tenant(**tenant_data.model_dump())
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@router.get("/", response_model=List[TenantResponse])
async def list_tenants(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    tenants = db.query(Tenant).offset(skip).limit(limit).all()
    return tenants


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if current_user.role != UserRole.ADMIN and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return tenant


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if current_user.role != UserRole.ADMIN and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    update_data = tenant_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)

    db.commit()
    db.refresh(tenant)
    return tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    db.delete(tenant)
    db.commit()

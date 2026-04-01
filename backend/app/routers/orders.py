from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import OrderCreate, OrderUpdate, OrderResponse
from app.models.models import Order, UserRole
from app.middleware.middleware import get_current_user, security
from app.services.order import create_order, get_order, get_orders_by_tenant, get_orders_by_user, get_orders_by_provider, update_order, cancel_order
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_new_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    try:
        order = create_order(db, order_data, current_user.id)
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    skip: int = 0,
    limit: int = 100,
    tenant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    if current_user.role == UserRole.ADMIN:
        query = db.query(Order)
        if tenant_id:
            query = query.filter(Order.tenant_id == tenant_id)
        return query.offset(skip).limit(limit).all()

    if current_user.role == UserRole.TENANT:
        return get_orders_by_tenant(db, current_user.tenant_id, skip, limit)

    if current_user.role == UserRole.PROVIDER and current_user.provider_profile:
        return get_orders_by_provider(db, current_user.provider_profile.id, skip, limit)

    return get_orders_by_user(db, current_user.id, skip, limit)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role != UserRole.ADMIN:
        if current_user.role == UserRole.TENANT and order.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied")
        if order.user_id != current_user.id and (
            not current_user.provider_profile or order.provider_id != current_user.provider_profile.id
        ):
            raise HTTPException(status_code=403, detail="Access denied")

    return order


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    order_data: OrderUpdate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role != UserRole.ADMIN:
        if current_user.role == UserRole.TENANT and order.tenant_id != current_user.tenant_id:
            raise HTTPException(status_code=403, detail="Access denied")
        if order.user_id != current_user.id and (
            not current_user.provider_profile or order.provider_id != current_user.provider_profile.id
        ):
            raise HTTPException(status_code=403, detail="Access denied")

    updated_order = update_order(db, order_id, order_data)
    return updated_order


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role != UserRole.ADMIN:
        if order.user_id != current_user.id and (
            not current_user.provider_profile or order.provider_id != current_user.provider_profile.id
        ):
            raise HTTPException(status_code=403, detail="Access denied")

    cancelled_order = cancel_order(db, order_id)
    return cancelled_order

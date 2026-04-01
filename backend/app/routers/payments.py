from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import PaymentCreate, PaymentUpdate, PaymentResponse
from app.models.models import Payment, Order, UserRole
from app.middleware.middleware import get_current_user, security
from app.services.payment import create_payment, get_payment, get_payment_by_order, get_payments_by_tenant, update_payment, process_payment, refund_payment
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_new_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    try:
        payment = create_payment(db, payment_data)
        return payment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    skip: int = 0,
    limit: int = 100,
    tenant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    if current_user.role == UserRole.ADMIN:
        if tenant_id:
            return get_payments_by_tenant(db, tenant_id, skip, limit)
        payments = db.query(Payment).offset(skip).limit(limit).all()
        return payments

    if current_user.role == UserRole.TENANT:
        return get_payments_by_tenant(db, current_user.tenant_id, skip, limit)

    return []


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment_by_id(
    payment_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    payment = get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    if current_user.role != UserRole.ADMIN and order.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return payment


@router.get("/order/{order_id}", response_model=PaymentResponse)
async def get_payment_for_order(
    order_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    payment = get_payment_by_order(db, order_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    order = db.query(Order).filter(Order.id == payment.order_id).first()
    if current_user.role != UserRole.ADMIN and order.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment_status(
    payment_id: int,
    payment_data: PaymentUpdate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    updated_payment = update_payment(db, payment_id, payment_data)
    if not updated_payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return updated_payment


@router.post("/{payment_id}/process", response_model=PaymentResponse)
async def process_payment_request(
    payment_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    payment = process_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return payment


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
async def refund_payment_request(
    payment_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        payment = refund_payment(db, payment_id)
        return payment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from typing import Optional, List
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from app.models.models import Order, OrderStatus, Service, Provider
from app.schemas.schemas import OrderCreate, OrderUpdate


def generate_order_number() -> str:
    return f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"


def create_order(db: Session, order_data: OrderCreate, user_id: int) -> Order:
    service = db.query(Service).filter(Service.id == order_data.service_id).first()
    if not service:
        raise ValueError("Service not found")

    provider = db.query(Provider).filter(Provider.id == order_data.provider_id).first()
    if not provider:
        raise ValueError("Provider not found")

    order = Order(
        order_number=generate_order_number(),
        tenant_id=order_data.tenant_id,
        user_id=user_id,
        provider_id=order_data.provider_id,
        service_id=order_data.service_id,
        status=OrderStatus.PENDING,
        scheduled_date=order_data.scheduled_date,
        notes=order_data.notes,
        total_amount=service.base_price
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def get_orders_by_tenant(db: Session, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
    return db.query(Order).filter(Order.tenant_id == tenant_id).offset(skip).limit(limit).all()


def get_orders_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
    return db.query(Order).filter(Order.user_id == user_id).offset(skip).limit(limit).all()


def get_orders_by_provider(db: Session, provider_id: int, skip: int = 0, limit: int = 100) -> List[Order]:
    return db.query(Order).filter(Order.provider_id == provider_id).offset(skip).limit(limit).all()


def update_order(db: Session, order_id: int, order_data: OrderUpdate) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None

    if order_data.status is not None:
        order.status = order_data.status
    if order_data.scheduled_date is not None:
        order.scheduled_date = order_data.scheduled_date
    if order_data.notes is not None:
        order.notes = order_data.notes

    db.commit()
    db.refresh(order)
    return order


def cancel_order(db: Session, order_id: int) -> Optional[Order]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        return None
    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order

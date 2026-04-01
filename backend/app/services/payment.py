from typing import Optional, List
from datetime import datetime
import uuid
from sqlalchemy.orm import Session
from app.models.models import Payment, PaymentStatus, Order
from app.schemas.schemas import PaymentCreate, PaymentUpdate


def create_payment(db: Session, payment_data: PaymentCreate) -> Payment:
    order = db.query(Order).filter(Order.id == payment_data.order_id).first()
    if not order:
        raise ValueError("Order not found")

    if order.total_amount != payment_data.amount:
        raise ValueError("Payment amount does not match order total")

    payment = Payment(
        order_id=payment_data.order_id,
        amount=payment_data.amount,
        currency=payment_data.currency,
        payment_method=payment_data.payment_method,
        status=PaymentStatus.PENDING
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payment(db: Session, payment_id: int) -> Optional[Payment]:
    return db.query(Payment).filter(Payment.id == payment_id).first()


def get_payment_by_order(db: Session, order_id: int) -> Optional[Payment]:
    return db.query(Payment).filter(Payment.order_id == order_id).first()


def get_payments_by_tenant(db: Session, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Payment]:
    return (
        db.query(Payment)
        .join(Order)
        .filter(Order.tenant_id == tenant_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_payment(
    db: Session, payment_id: int, payment_data: PaymentUpdate
) -> Optional[Payment]:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None

    if payment_data.status is not None:
        payment.status = payment_data.status
    if payment_data.payment_method is not None:
        payment.payment_method = payment_data.payment_method
    if payment_data.transaction_id is not None:
        payment.transaction_id = payment_data.transaction_id

    db.commit()
    db.refresh(payment)
    return payment


def process_payment(db: Session, payment_id: int) -> Optional[Payment]:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None

    transaction_id = f"TXN-{uuid.uuid4().hex[:16].upper()}"
    payment.status = PaymentStatus.COMPLETED
    payment.transaction_id = transaction_id

    db.commit()
    db.refresh(payment)
    return payment


def refund_payment(db: Session, payment_id: int) -> Optional[Payment]:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        return None

    if payment.status != PaymentStatus.COMPLETED:
        raise ValueError("Can only refund completed payments")

    payment.status = PaymentStatus.REFUNDED
    db.commit()
    db.refresh(payment)
    return payment

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.schemas.schemas import ReviewCreate, ReviewUpdate, ReviewResponse
from app.models.models import Review, Order, Provider, UserRole, OrderStatus
from app.middleware.middleware import get_current_user, security
from fastapi.security import HTTPAuthorizationCredentials

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    order = db.query(Order).filter(Order.id == review_data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Can only review your own orders")

    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only review completed orders")

    existing = db.query(Review).filter(Review.order_id == review_data.order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Order already reviewed")

    review = Review(
        order_id=review_data.order_id,
        tenant_id=review_data.tenant_id,
        user_id=current_user.id,
        provider_id=review_data.provider_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    db.add(review)

    # Update provider rating
    provider = db.query(Provider).filter(Provider.id == review_data.provider_id).first()
    if provider:
        total_rating = provider.rating * provider.total_reviews + review_data.rating
        provider.total_reviews += 1
        provider.rating = total_rating / provider.total_reviews

    db.commit()
    db.refresh(review)
    return review


@router.get("/", response_model=List[ReviewResponse])
async def list_reviews(
    skip: int = 0,
    limit: int = 100,
    provider_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Review)
    if provider_id:
        query = query.filter(Review.provider_id == provider_id)
    reviews = query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return reviews


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(
    review_id: int,
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")

    if review_data.rating is not None:
        old_rating = review.rating
        review.rating = review_data.rating

        # Update provider rating
        provider = db.query(Provider).filter(Provider.id == review.provider_id).first()
        if provider:
            total_rating = provider.rating * provider.total_reviews - old_rating + review_data.rating
            provider.rating = total_rating / provider.total_reviews

    if review_data.comment is not None:
        review.comment = review_data.comment

    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    current_user = await get_current_user(credentials, db=db)

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")

    # Update provider rating
    provider = db.query(Provider).filter(Provider.id == review.provider_id).first()
    if provider and provider.total_reviews > 0:
        total_rating = provider.rating * provider.total_reviews - review.rating
        provider.total_reviews -= 1
        if provider.total_reviews > 0:
            provider.rating = total_rating / provider.total_reviews
        else:
            provider.rating = 0.0

    db.delete(review)
    db.commit()

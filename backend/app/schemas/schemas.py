from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    TENANT = "tenant"
    PROVIDER = "provider"


class OrderStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


# Tenant Schemas
class TenantBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class TenantResponse(TenantBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.TENANT
    tenant_id: Optional[int] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Service Category Schemas
class ServiceCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class ServiceCategoryCreate(ServiceCategoryBase):
    pass


class ServiceCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceCategoryResponse(ServiceCategoryBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Service Schemas
class ServiceBase(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: int
    base_price: float
    duration_minutes: int = 60


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    base_price: Optional[float] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceResponse(ServiceBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Provider Schemas
class ProviderBase(BaseModel):
    business_name: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ProviderCreate(ProviderBase):
    user_id: int


class ProviderUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None


class ProviderResponse(ProviderBase):
    id: int
    user_id: int
    rating: float
    total_reviews: int
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Order Schemas
class OrderBase(BaseModel):
    service_id: int
    provider_id: int
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    tenant_id: int


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    tenant_id: int
    user_id: int
    provider_id: int
    service_id: int
    status: OrderStatus
    scheduled_date: Optional[datetime]
    notes: Optional[str]
    total_amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentBase(BaseModel):
    order_id: int
    amount: float
    currency: str = "USD"
    payment_method: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: int
    status: PaymentStatus
    transaction_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Review Schemas
class ReviewBase(BaseModel):
    order_id: int
    provider_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    tenant_id: int
    user_id: int


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(ReviewBase):
    id: int
    tenant_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

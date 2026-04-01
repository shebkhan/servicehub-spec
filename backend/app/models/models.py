from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

def new_id():
    return str(uuid.uuid4())

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    PROVIDER = "provider"
    CUSTOMER = "customer"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    DISPATCHED = "dispatched"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TenantPlan(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

# Base Models
class TokenPayload(BaseModel):
    sub: str
    tenant_id: Optional[str] = None
    role: UserRole
    type: str = "access"
    exp: int
    iat: int

class UserBase(BaseModel):
    email: str
    name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.CUSTOMER

class UserResponse(UserBase):
    id: str = Field(default_factory=new_id)
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CustomerBase(BaseModel):
    default_address: Optional[dict] = None
    default_payment: Optional[str] = None

class CustomerCreate(CustomerBase):
    user_id: str
    tenant_id: str

class CustomerResponse(CustomerBase):
    id: str = Field(default_factory=new_id)
    user_id: str
    tenant_id: str
    credit_balance: float = 0.0
    notification_prefs: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProviderBase(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    is_verified: bool = False
    verified_at: Optional[datetime] = None
    working_hours: dict = {}
    service_radius: int = 25
    avg_rating: float = 0.0
    total_reviews: int = 0
    total_jobs: int = 0
    completed_jobs: int = 0

class ProviderCreate(ProviderBase):
    user_id: str
    tenant_id: str

class ProviderResponse(ProviderBase):
    id: str = Field(default_factory=new_id)
    user_id: str
    tenant_id: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceCategoryBase(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True

class ServiceCategoryResponse(ServiceCategoryBase):
    id: str = Field(default_factory=new_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GlobalServiceBase(BaseModel):
    name: str
    slug: str
    category_id: str
    description: Optional[str] = None
    base_price: float
    duration: int
    icon: Optional[str] = None
    is_active: bool = True

class GlobalServiceResponse(GlobalServiceBase):
    id: str = Field(default_factory=new_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TenantServiceBase(BaseModel):
    global_service_id: str
    tenant_id: str
    name: str
    description: Optional[str] = None
    price: float
    duration: int
    category: str
    is_active: bool = True
    requires_address: bool = False
    max_per_day: Optional[int] = None

class TenantServiceResponse(TenantServiceBase):
    id: str = Field(default_factory=new_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProviderServiceBase(BaseModel):
    provider_id: str
    tenant_service_id: str
    price: float
    duration: int
    description: Optional[str] = None
    is_active: bool = True

class ProviderServiceResponse(ProviderServiceBase):
    id: str = Field(default_factory=new_id)

class OrderItemBase(BaseModel):
    service_id: str
    quantity: int = 1

class OrderItemCreate(OrderItemBase):
    pass

class OrderItemResponse(OrderItemBase):
    id: str = Field(default_factory=new_id)
    order_id: str
    tenant_service_id: str
    price: float
    duration: int

class OrderBase(BaseModel):
    scheduled_date: str
    scheduled_time: str
    service_at: str = "home"
    address: Optional[dict] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]
    payment_method: str = "wallet"
    promo_code: Optional[str] = None

class OrderResponse(OrderBase):
    id: str = Field(default_factory=new_id)
    order_number: str
    tenant_id: str
    customer_id: str
    provider_id: Optional[str] = None
    status: OrderStatus = OrderStatus.PENDING
    items: List[OrderItemResponse] = []
    subtotal: float = 0.0
    discount: float = 0.0
    total: float = 0.0
    credit_used: float = 0.0
    cash_collected: float = 0.0
    placed_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None

class ReviewBase(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    images: List[str] = []

class ReviewCreate(ReviewBase):
    order_id: str
    customer_id: str
    provider_id: str

class ReviewResponse(ReviewBase):
    id: str = Field(default_factory=new_id)
    tenant_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WalletTransactionBase(BaseModel):
    type: str
    amount: float
    description: str

class WalletTransactionCreate(WalletTransactionBase):
    customer_id: str

class WalletTransactionResponse(WalletTransactionBase):
    id: str = Field(default_factory=new_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TenantSettings(BaseModel):
    booking_lead_time: int = 60
    max_advance_days: int = 30
    working_hours: dict = {}
    service_radius: int = 25
    currency: str = "USD"
    timezone: str = "UTC"
    email_notifications: bool = True
    push_notifications: bool = True
    enable_wallet: bool = True
    enable_promo_codes: bool = True
    enable_reviews: bool = True

class TenantBase(BaseModel):
    name: str
    slug: str
    logo: Optional[str] = None
    primary_color: str = "#0066CC"
    secondary_color: str = "#FFFFFF"
    plan: TenantPlan = TenantPlan.FREE

class TenantCreate(TenantBase):
    pass

class TenantResponse(TenantBase):
    id: str = Field(default_factory=new_id)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    settings: TenantSettings = Field(default_factory=TenantSettings)

class PromoCodeBase(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_order_value: float = 0
    max_discount: float = 0
    usage_limit: int = 0
    valid_from: datetime = Field(default_factory=datetime.utcnow)
    valid_until: datetime

class PromoCodeCreate(PromoCodeBase):
    tenant_id: str

class PromoCodeResponse(PromoCodeBase):
    id: str = Field(default_factory=new_id)
    tenant_id: str
    used_count: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AvailabilitySlot(BaseModel):
    time: str
    available: bool

class AvailabilityResponse(BaseModel):
    date: str
    slots: List[AvailabilitySlot]

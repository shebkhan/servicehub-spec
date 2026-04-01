# JustClean SaaS - Technical Specification Document

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema](#3-database-schema)
4. [API Specification](#4-api-specification)
5. [Mobile App Specifications](#5-mobile-app-specifications)
6. [Web Frontend Specifications](#6-web-frontend-specifications)
7. [Admin Dashboard](#7-admin-dashboard)
8. [Payment & Billing](#8-payment--billing)
9. [Multi-Tenancy](#9-multi-tenancy)
10. [Security](#10-security)
11. [DevOps & Infrastructure](#11-devops--infrastructure)
12. [Feature Roadmap](#12-feature-roadmap)

---

## 1. Project Overview

### 1.1 Project Name
**ServiceHub** (placeholder SaaS name for JustClean clone)

### 1.2 Project Type
Multi-tenant SaaS platform for on-demand local services marketplace

### 1.3 Core Functionality
A white-label marketplace connecting customers with service providers (cleaning, beauty, automotive, pet care) featuring booking management, credit-based payments, scheduling, and provider management.

### 1.4 Target Users
| User Type | Description |
|-----------|-------------|
| **Customers** | End users booking services |
| **Service Providers** | Individual contractors or businesses offering services |
| **Tenant Admins** | Business owners managing their own service marketplace |
| **Super Admin** | Platform owner managing all tenants |

### 1.5 Supported Services
- Laundry collection & delivery
- Home cleaning
- Mobile car wash
- Car wash station
- Male hair barbers (at home / at barbershop)
- Female hair salons (at home / at boutique)
- Male spas (at home / at spa)
- Female spas (at home / at spa)
- Mobile nail station
- Pets grooming

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
+-------------------------------------------------------------------+
|                           CLIENTS                                 |
+------------+------------+------------+------------+--------------+
|  Customer  |   Provider |  Tenant    |   Super   |    Guest     |
|   Mobile   |   Mobile   |   Admin    |   Admin   |    (Web)     |
|  (Flutter) |  (Flutter) | (Next.js)  | (Next.js) |              |
+-------+----+------+-----+------+-----+----+------+----+-----+
        |            |          |          |           |
        +------------+----------+----------+-----------+-+
                            |
                    +-------+-------+
                    |   API Gateway  |
                    |   (Kong/Nginx) |
                    +-------+-------+
                            |
   +------------------------+------------------------+
   |                        |                        |
+--+--------+      +--------+--------+      +--------+--------+
|   FastAPI   |      |  Auth Service |      | Notification |
|   Backend   |      |   (Keycloak) |      |   Service    |
|   (Python)  |      |              |      |  (OneSignal) |
+-------------+      +--------------+      +-------------+
        |
        |                 +---------------+
        |                 |    Stripe     |
        |                 |   Payments    |
        |                 +---------------+
        |
   +----+-------------------------+
   |        PostgreSQL + Redis      |
   |      (Supabase / AWS RDS)      |
   +--------------------------------+
```

### 2.2 Technology Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| **Mobile Apps** | Flutter | 3.19+ |
| **Web Frontend** | Next.js 14 | 14.x |
| **Backend API** | FastAPI (Python) | 0.110+ |
| **Database** | PostgreSQL 16 | 16.x |
| **Cache/Queue** | Redis | 7.x |
| **ORM** | Prisma | 5.x |
| **Auth** | Supabase Auth / JWT | - |
| **Payments** | Stripe | - |
| **File Storage** | AWS S3 / Cloudflare R2 | - |
| **Push Notifications** | OneSignal | - |
| **Email** | SendGrid / AWS SES | - |
| **Monitoring** | Sentry + PostHog | - |
| **Hosting** | Vercel (web) + Railway (API) | - |

### 2.3 Microservices Breakdown

| Service | Responsibility | Language/Framework |
|---------|---------------|---------------------|
| **api-gateway** | Request routing, rate limiting | Node.js / Kong |
| **auth-service** | Authentication, JWT, OAuth | Python/FastAPI |
| **user-service** | User management, profiles | Python/FastAPI |
| **booking-service** | Order lifecycle, scheduling | Python/FastAPI |
| **payment-service** | Stripe integration, wallets | Python/FastAPI |
| **notification-service** | Push, email, SMS | Node.js |
| **provider-service** | Provider onboarding, verification | Python/FastAPI |
| **review-service** | Ratings, reviews | Python/FastAPI |
| **analytics-service** | Usage tracking, reporting | Python/FastAPI |
| **search-service** | Service discovery, geo-search | Typesense/Elasticsearch |

---

## 3. Database Schema

### 3.1 Multi-Tenant Strategy
- **Approach**: Row-Level Security (RLS) with `tenant_id` on all tenant-scoped tables
- **Tenant isolation**: PostgreSQL schemas per tenant (optional for enterprise)
- **Shared tables**: `users`, `services`, `service_categories` (global catalog)

### 3.2 Entity Relationship Diagram (Conceptual)

```
+-------------+     +-------------+     +-------------+
|    Tenant   |---->|   Tenant    |---->|    User     |
|  (Business) |     |  Settings   |     |  (Member)   |
+-------------+     +-------------+     +------+------+
       |                                        |
       |         +-----------------------------+
       |         |                              |
       v         v                              v
+-------------+          +-------------+     +-------------+
|   Service   |<--------|    Order    |---->|   Payment   |
|  (Offered)  |          |   (Booking)|     |  (Credit)   |
+-------------+          +------+------+     +-------------+
       |                        |
       |                        |
       v                        v
+-------------+          +-------------+
|    Review  |          |   Schedule  |
|            |          |   (Slots)   |
+-------------+          +-------------+
```

### 3.3 Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// SHARED / GLOBAL TABLES
// ============================================

model SuperAdmin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ServiceCategory {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  icon        String?
  description String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  services    Service[]
}

model GlobalService {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  categoryId  String
  category    ServiceCategory @relation(fields: [categoryId], references: [id])
  description String?
  basePrice   Decimal   @db.Decimal(10, 2)
  duration    Int
  icon        String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  
  tenantServices TenantService[]
  orderItems     OrderItem[]
}

// ============================================
// TENANT (Business) TABLES
// ============================================

model Tenant {
  id            String    @id @default(uuid())
  name          String
  slug          String    @unique
  logo          String?
  primaryColor  String    @default("#0066CC")
  secondaryColor String   @default("#FFFFFF")
  
  plan          TenantPlan @default(FREE)
  subscriptionEnd DateTime?
  settings      Json      @default("{}")
  
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  users         TenantUser[]
  tenantsServices TenantService[]
  providers     Provider[]
  customers     Customer[]
  orders        Order[]
  payments      Payment[]
  reviews       Review[]
  promoCodes    PromoCode[]
}

enum TenantPlan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

model TenantSettings {
  id              String  @id @default(uuid())
  tenantId        String  @unique
  tenant          Tenant  @relation(fields: [tenantId], references: [id])
  
  bookingLeadTime Int     @default(60)
  maxAdvanceDays  Int     @default(30)
  workingHours    Json    @default("{}")
  serviceRadius   Int     @default(25)
  currency        String  @default("USD")
  timezone        String  @default("UTC")
  
  emailNotifications Boolean @default(true)
  pushNotifications  Boolean @default(true)
  
  enableWallet     Boolean @default(true)
  enablePromoCodes Boolean @default(true)
  enableReviews    Boolean @default(true)
}

// ============================================
// USER MANAGEMENT
// ============================================

model TenantUser {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  email     String
  password  String
  name      String
  phone     String?
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  customer  Customer?
  provider  Provider?
  
  @@unique([tenantId, email])
}

enum UserRole {
  SUPER_ADMIN
  TENANT_ADMIN
  PROVIDER
  CUSTOMER
}

model Customer {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            TenantUser @relation(fields: [userId], references: [id])
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  defaultAddress  Json?
  defaultPayment  String?
  
  creditBalance   Decimal  @default(0) @db.Decimal(10, 2)
  notificationPrefs Json   @default("{}")
  
  createdAt       DateTime @default(now())
  
  orders          Order[]
  reviews         Review[]
  walletTxns      WalletTransaction[]
  
  @@index([tenantId])
}

model Provider {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            TenantUser @relation(fields: [userId], references: [id])
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  businessName    String?
  bio             String?
  profileImage    String?
  
  isVerified      Boolean  @default(false)
  verifiedAt      DateTime?
  
  workingHours    Json     @default("{}")
  serviceRadius   Int      @default(25)
  
  avgRating       Decimal  @default(0) @db.Decimal(3, 2)
  totalReviews    Int      @default(0)
  totalJobs       Int      @default(0)
  completedJobs   Int      @default(0)
  
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  
  services        ProviderService[]
  schedules       ProviderSchedule[]
  orders          Order[]
  reviews         Review[]
  
  @@index([tenantId])
}

model ProviderService {
  id              String   @id @default(uuid())
  providerId      String
  provider        Provider @relation(fields: [providerId], references: [id])
  tenantServiceId String
  tenantService   TenantService @relation(fields: [tenantServiceId], references: [id])
  
  price           Decimal  @db.Decimal(10, 2)
  duration        Int
  description     String?
  isActive        Boolean  @default(true)
  
  @@unique([providerId, tenantServiceId])
}

model ProviderSchedule {
  id          String   @id @default(uuid())
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id])
  
  dayOfWeek   Int
  startTime   String
  endTime     String
  isAvailable Boolean  @default(true)
  
  bookings    BookingSlot[]
}

// ============================================
// SERVICES (Tenant-Specific Offerings)
// ============================================

model TenantService {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  globalServiceId String
  globalService   GlobalService @relation(fields: [globalServiceId], references: [id])
  
  name            String
  description     String?
  price           Decimal  @db.Decimal(10, 2)
  duration        Int
  category        String
  
  isActive        Boolean  @default(true)
  requiresAddress Boolean  @default(false)
  maxPerDay       Int?
  
  createdAt       DateTime @default(now())
  
  orderItems      OrderItem[]
  providerServices ProviderService[]
  
  @@unique([tenantId, globalServiceId, category])
  @@index([tenantId])
}

// ============================================
// BOOKINGS & ORDERS
// ============================================

model Order {
  id              String   @id @default(uuid())
  orderNumber     String   @unique
  
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  providerId      String?
  provider        Provider? @relation(fields: [providerId], references: [id])
  
  status          OrderStatus @default(PENDING)
  
  scheduledDate   DateTime
  scheduledTime   String
  serviceDuration Int
  serviceAt       String
  address         Json?
  
  items           OrderItem[]
  
  subtotal        Decimal  @db.Decimal(10, 2)
  discount        Decimal  @db.Decimal(10, 2) @default(0)
  total           Decimal  @db.Decimal(10, 2)
  
  creditUsed      Decimal  @db.Decimal(10, 2) @default(0)
  cashCollected   Decimal  @db.Decimal(10, 2) @default(0)
  
  placedAt        DateTime @default(now())
  confirmedAt     DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  cancellationReason String?
  
  notes           String?
  internalNotes   String?
  
  @@index([tenantId])
  @@index([customerId])
  @@index([providerId])
  @@index([scheduledDate])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  DISPATCHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  REFUNDED
}

model OrderItem {
  id              String   @id @default(uuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id])
  tenantServiceId String
  tenantService   TenantService @relation(fields: [tenantServiceId], references: [id])
  
  quantity        Int      @default(1)
  price           Decimal  @db.Decimal(10, 2)
  duration        Int
  subtotal        Decimal  @db.Decimal(10, 2)
  status          OrderItemStatus @default(PENDING)
}

enum OrderItemStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model BookingSlot {
  id          String   @id @default(uuid())
  scheduleId  String
  schedule    ProviderSchedule @relation(fields: [scheduleId], references: [id])
  
  date        DateTime
  startTime   String
  endTime     String
  isBooked    Boolean  @default(false)
  orderId     String?
  
  @@unique([scheduleId, date, startTime])
}

// ============================================
// PAYMENTS & WALLET
// ============================================

model Payment {
  id              String   @id @default(uuid())
  paymentId       String   @unique
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  orderId         String?
  order           Order?   @relation(fields: [orderId], references: [id])
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  
  type            PaymentType
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  status          PaymentStatus @default(PENDING)
  
  stripePaymentId String?
  stripeChargeId  String?
  
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  
  @@index([tenantId])
  @@index([customerId])
}

enum PaymentType {
  ORDER_PAYMENT
  WALLET_TOPUP
  REFUND
  PROVIDER_PAYOUT
}

enum PaymentStatus {
  PENDING
  PROCESSING
  SUCCEEDED
  FAILED
  REFUNDED
}

model WalletTransaction {
  id              String   @id @default(uuid())
  customerId      String
  customer        Customer @relation(fields: [customerId], references: [id])
  
  type            WalletTxnType
  amount          Decimal  @db.Decimal(10, 2)
  balanceAfter    Decimal  @db.Decimal(10, 2)
  
  description     String?
  orderId         String?
  
  createdAt       DateTime @default(now())
}

enum WalletTxnType {
  TOP_UP
  PURCHASE
  REFUND
  BONUS
}

model PromoCode {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  code        String   @unique
  type        PromoType @default(PERCENTAGE)
  value       Decimal  @db.Decimal(10, 2)
  
  minOrder    Decimal  @db.Decimal(10, 2) @default(0)
  maxDiscount Decimal  @db.Decimal(10, 2)?
  
  startsAt    DateTime @default(now())
  expiresAt   DateTime?
  
  usageLimit  Int?
  usedCount    Int     @default(0)
  
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

enum PromoType {
  PERCENTAGE
  FIXED
}

// ============================================
// REVIEWS
// ============================================

model Review {
  id          String   @id @default(uuid())
  tenantId    String
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  customerId  String
  customer    Customer @relation(fields: [customerId], references: [id])
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id])
  
  rating      Int
  comment     String?
  images      String[]
  
  isVisible   Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  @@unique([orderId])
  @@index([tenantId])
  @@index([providerId])
}

// ============================================
// NOTIFICATIONS
// ============================================

model Notification {
  id          String   @id @default(uuid())
  userId      String
  tenantId    String?
  
  type        NotificationType
  title       String
  message     String
  data        Json?
  
  isRead      Boolean  @default(false)
  sentVia     NotificationChannel[]
  
  createdAt   DateTime @default(now())
  
  @@index([userId, isRead])
}

enum NotificationType {
  ORDER_PLACED
  ORDER_CONFIRMED
  ORDER_DISPATCHED
  ORDER_STARTED
  ORDER_COMPLETED
  ORDER_CANCELLED
  REVIEW_REQUEST
  PROMO_CREDIT
  PAYMENT_RECEIVED
  PROVIDER_ASSIGNED
}

enum NotificationChannel {
  PUSH
  EMAIL
  SMS
}

// ============================================
// AUDIT LOG
// ============================================

model AuditLog {
  id          String   @id @default(uuid())
  tenantId    String?
  userId      String?
  
  action      String
  entityType  String
  entityId    String
  
  oldData     Json?
  newData     Json?
  
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime @default(now())
  
  @@index([tenantId])
  @@index([entityType, entityId])
}
```

---

## 4. API Specification

### 4.1 Base URL Structure

```
Production: https://api.servicehub.com/v1
Staging:    https://api.staging.servicehub.com/v1
Local:      http://localhost:8000/v1
```

### 4.2 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate refresh token |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset password with token |

**JWT Structure:**
```json
{
  "sub": "user-uuid",
  "tenant_id": "tenant-uuid",
  "role": "CUSTOMER",
  "exp": 1712000000,
  "iat": 1711996400,
  "type": "access"
}
```

### 4.3 API Endpoints by Module

#### User Management
```
GET    /users/me
PATCH  /users/me
DELETE /users/me

GET    /users/addresses
POST   /users/addresses
PATCH  /users/addresses/:id
DELETE /users/addresses/:id

GET    /users/payment-methods
POST   /users/payment-methods
DELETE /users/payment-methods/:id
```

#### Services
```
GET    /services
GET    /services/categories
GET    /services/:slug

POST   /tenant/services
PATCH  /tenant/services/:id
DELETE /tenant/services/:id
```

#### Providers
```
GET    /providers
GET    /providers/:id
GET    /providers/:id/services
GET    /providers/:id/availability

PATCH  /providers/me
GET    /providers/me/schedule
PUT    /providers/me/schedule
GET    /providers/me/earnings
```

#### Bookings/Orders
```
GET    /orders
POST   /orders
GET    /orders/:id
PATCH  /orders/:id/cancel

GET    /provider/orders
PATCH  /provider/orders/:id/status
POST   /provider/orders/:id/start
POST   /provider/orders/:id/complete

GET    /tenant/orders
PATCH  /tenant/orders/:id
POST   /tenant/orders/:id/assign
```

#### Payments & Wallet
```
GET    /wallet/balance
GET    /wallet/transactions
POST   /wallet/topup

POST   /payments/stripe-intent
POST   /payments/confirm
POST   /payments/refund
```

#### Reviews
```
GET    /reviews/:providerId
POST   /reviews
PATCH  /reviews/:id
```

#### Tenant Management
```
GET    /admin/tenants
POST   /admin/tenants
PATCH  /admin/tenants/:id
DELETE /admin/tenants/:id

GET    /tenant/settings
PATCH  /tenant/settings
GET    /tenant/analytics
POST   /tenant/promo-codes
```

### 4.4 Request/Response Examples

#### Create Order
```json
// POST /orders
// Request
{
  "scheduled_date": "2026-04-05",
  "scheduled_time": "10:00",
  "service_at": "home",
  "address": {
    "lat": 3.1390,
    "lng": 101.6869,
    "full_address": "123 Jalan Utama, Kuala Lumpur",
    "instructions": "Gate code: 1234"
  },
  "items": [
    {
      "service_id": "svc-uuid",
      "quantity": 1
    }
  ],
  "payment_method": "wallet",
  "promo_code": "SAVE20"
}

// Response
{
  "success": true,
  "data": {
    "order_id": "ord-uuid",
    "order_number": "JC-20260401-0001",
    "status": "PENDING",
    "items": [],
    "subtotal": "85.00",
    "discount": "10.00",
    "credit_used": "75.00",
    "cash_due": "0.00",
    "scheduled_date": "2026-04-05",
    "scheduled_time": "10:00"
  }
}
```

#### Get Provider Availability
```json
// GET /providers/:id/availability?date=2026-04-05

// Response
{
  "date": "2026-04-05",
  "slots": [
    { "time": "09:00", "available": true },
    { "time": "10:00", "available": true },
    { "time": "11:00", "available": false },
    { "time": "12:00", "available": true }
  ]
}
```

---

## 5. Mobile App Specifications

### 5.1 Flutter App Structure

```
justclean_app/
lib/
  main.dart
  app/
    app.dart
    routes.dart
    themes.dart
  
  core/
    constants/
      api_constants.dart
      app_constants.dart
      storage_keys.dart
    errors/
      exceptions.dart
      failure.dart
    network/
      api_client.dart
      api_interceptor.dart
      dio_client.dart
    utils/
      validators.dart
      formatters.dart
      helpers.dart
  
  data/
    models/
      user_model.dart
      service_model.dart
      order_model.dart
    repositories/
      auth_repository_impl.dart
      service_repository_impl.dart
    datasources/
      remote/
        api_datasource.dart
      local/
        local_storage.dart
  
  domain/
    entities/
    repositories/
    usecases/
  
  presentation/
    blocs/
      auth/
        auth_bloc.dart
        auth_event.dart
        auth_state.dart
      service/
      order/
      wallet/
    pages/
      splash/
      auth/
        login_page.dart
        register_page.dart
        forgot_password_page.dart
      home/
        home_page.dart
      services/
      booking/
        select_service_page.dart
        select_provider_page.dart
        select_time_page.dart
        confirm_booking_page.dart
        booking_success_page.dart
      orders/
      wallet/
      profile/
      provider/
    widgets/
      common/
        app_button.dart
        app_text_field.dart
        loading_indicator.dart
        error_widget.dart
      service/
        service_card.dart
        category_chip.dart
      booking/
        time_slot_picker.dart
        provider_card.dart
      order/
        order_card.dart

assets/
  images/
  icons/
  animations/

pubspec.yaml
```

### 5.2 Key Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_bloc: ^8.1.6
  equatable: ^2.0.5
  
  # Dependency Injection
  get_it: ^7.7.0
  injectable: ^2.4.4
  
  # Networking
  dio: ^5.7.0
  retrofit: ^4.2.0
  
  # Local Storage
  shared_preferences: ^2.3.2
  flutter_secure_storage: ^9.2.2
  hive: ^2.2.3
  
  # UI
  flutter_svg: ^2.0.10
  cached_network_image: ^3.4.1
  shimmer: ^3.0.0
  flutter_rating_bar: ^4.0.1
  intl: ^0.19.0
  
  # Maps & Location
  google_maps_flutter: ^2.9.0
  geolocator: ^13.0.1
  geocoding: ^3.0.0
  
  # Push Notifications
  firebase_core: ^3.6.0
  firebase_messaging: ^15.1.3
  one_signal_flutter: ^3.5.2
  
  # Payments
  stripe_flutter: ^4.0.0
  
  # Media
  image_picker: ^1.1.2
  image_cropper: ^8.0.2
  photo_view: ^0.15.0
  
  # Utilities
  uuid: ^4.5.0
  url_launcher: ^6.3.0
  package_info_plus: ^8.0.2
  connectivity_plus: ^6.0.5

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.13
  injectable_generator: ^2.6.2
  retrofit_generator: ^4.2.0
  hive_generator: ^2.0.1
  flutter_lints: ^4.0.0
```

### 5.3 Customer App Screens

| Screen | Description | Key Components |
|--------|-------------|----------------|
| **Splash** | App loading, check auth | Logo animation, check stored token |
| **Login** | Email/password login | Form validation, remember me, forgot password |
| **Register** | New account creation | Name, email, phone, password, referral code |
| **Home** | Dashboard with services | Category carousel, featured services, deals |
| **Service List** | Browse by category | Grid of services, filter, search |
| **Service Detail** | Single service info | Price, duration, description, provider count |
| **Select Provider** | Choose provider | Rating, distance, price, availability |
| **Select Time** | Pick date & slot | Calendar, available time slots |
| **Confirm Booking** | Order summary | Items, address, payment method, promo code |
| **Payment** | Credit card / wallet | Stripe integration, wallet balance |
| **Booking Success** | Confirmation | Order number, provider info, ETA |
| **My Orders** | Order history | Tabs (Upcoming, Ongoing, Completed), filters |
| **Order Detail** | Single order | Status timeline, provider info, actions |
| **Track Order** | Live tracking | Map with provider location, ETA |
| **Wallet** | Credit balance | Top up, transaction history, bonus info |
| **Profile** | User settings | Edit info, addresses, payment methods |
| **Reviews** | Write/view reviews | Star rating, text, photos |
| **Notifications** | All notifications | List with read/unread status |
| **Help & Support** | FAQs, chat | WebView or in-app chat |

### 5.4 Provider App Screens

| Screen | Description |
|--------|-------------|
| **Dashboard** | Today's jobs, earnings, rating |
| **Incoming Requests** | New booking requests to accept/decline |
| **My Jobs** | Scheduled, ongoing, completed jobs |
| **Job Detail** | Customer info, address, navigate button |
| **Start Job** | Check-in, mark job started |
| **Complete Job** | Add notes, request payment |
| **Earnings** | Weekly/monthly breakdown, payout history |
| **My Profile** | Bio, services, working hours |
| **Availability** | Set weekly schedule |
| **Reviews** | View customer feedback |
| **Settings** | Notifications, preferences |

---

## 6. Web Frontend Specifications

### 6.1 Next.js 14 App Structure

```
web/
app/
  (auth)/
    login/
    register/
    forgot-password/
  
  (customer)/
    page.tsx
    services/
    booking/
    orders/
    profile/
  
  (provider)/
    provider/
      dashboard/
      jobs/
      earnings/
      settings/
  
  (admin)/
    admin/
      dashboard/
      orders/
      providers/
      customers/
      services/
      reports/
      settings/
  
  api/
    auth/
    orders/
    webhooks/
  
  layout.tsx
  globals.css
  not-found.tsx

components/
  ui/
    button.tsx
    card.tsx
    dialog.tsx
  layout/
    header.tsx
    footer.tsx
    sidebar.tsx
    mobile-nav.tsx
  forms/
    booking-form.tsx
    service-form.tsx
  shared/
    service-card.tsx
    provider-card.tsx
    order-card.tsx
    price-tag.tsx

lib/
  utils.ts
  api-client.ts
  validators.ts

hooks/
  use-auth.ts
  use-orders.ts
  use-services.ts

types/
  index.ts

package.json
```

### 6.2 Key Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    
    "@tanstack/react-query": "^5.59.0",
    "zustand": "^5.0.0",
    
    "next-auth": "^4.24.8",
    
    "zod": "^3.23.8",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    
    "shadcn-ui": "^0.10.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    
    "@stripe/stripe-js": "^4.8.0",
    "@stripe/react-stripe-js": "^2.8.0",
    
    "lucide-react": "^0.453.0",
    "date-fns": "^4.1.0",
    "react-hot-toast": "^2.4.1",
    
    "@uploadthing/react": "^7.0.3"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^22.9.0",
    "tailwindcss": "^3.4.14",
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.15"
  }
}
```

---

## 7. Admin Dashboard

### 7.1 Admin Features by Role

#### Super Admin Dashboard
| Feature | Description |
|---------|-------------|
| **Tenant Management** | Create, edit, suspend tenants |
| **Platform Analytics** | Total GMV, orders, users across all tenants |
| **Revenue Overview** | Subscription revenue, commission earnings |
| **Global Settings** | Service categories, system config |
| **Audit Logs** | All admin actions logged |
| **Support Tickets** | Handle tenant escalations |

#### Tenant Admin Dashboard
| Feature | Description |
|---------|-------------|
| **Dashboard** | Today's orders, revenue, new customers |
| **Order Management** | All orders with status filters, manual actions |
| **Provider Management** | Approve, suspend, view performance |
| **Customer Management** | View, edit, refund |
| **Service Catalog** | Add/edit services offered |
| **Pricing** | Set prices, create packages |
| **Promo Codes** | Create discount codes |
| **Reports** | Revenue, orders, provider stats |
| **Settings** | Business info, working hours, notifications |
| **Payouts** | Provider payment history |

### 7.2 Admin Dashboard Pages

```
/admin
  /dashboard
  /orders
    /
    /:id
  /providers
    /
    /:id
    /:id/earnings
  /customers
    /
    /:id
  /services
    /
    /new
    /:id/edit
  /transactions
    /
    /payouts
  /promos
    /
    /new
  /reports
    /revenue
    /orders
    /providers
  /settings
    /general
    /working-hours
    /notifications
    /api-keys
  /support
    /tickets
```

---

## 8. Payment & Billing

### 8.1 Payment Flows

#### Credit/Wallet Flow
```
1. User tops up wallet (Stripe)
         |
2. Payment confirmed - Credit added to wallet
         |
3. User books service - Credit deducted
         |
4. Order completed - Provider earnings calculated
```

#### Direct Payment Flow
```
1. User selects "Pay Now" option
         |
2. Stripe Payment Intent created
         |
3. User completes payment
         |
4. Payment captured - Order confirmed
```

#### Credit Bonus Structure (like original)
| Package | Credit | Bonus | Total Credit |
|---------|--------|-------|--------------|
| Basic | $100 | $25 | $125 |
| Standard | $250 | $62.50 | $312.50 |
| Premium | $500 | $125 | $625 |
| VIP | $1000 | $250 | $1250 |

### 8.2 Stripe Integration

```python
# Payment Service Functions

async def create_wallet_topup(customer_id: str, amount: int):
    """Create payment intent for wallet topup"""
    customer = await get_or_create_stripe_customer(customer_id)
    
    intent = stripe.PaymentIntent.create(
        amount=amount * 100,
        currency="usd",
        customer=customer.id,
        metadata={
            "type": "wallet_topup",
            "customer_id": customer_id
        }
    )
    return intent


async def create_order_payment(order_id: str, amount: int):
    """Create payment for order"""
    intent = stripe.PaymentIntent.create(
        amount=amount * 100,
        currency="usd",
        capture_method="manual",
        metadata={
            "type": "order_payment",
            "order_id": order_id
        }
    )
    return intent


async def capture_payment(payment_intent_id: str) -> bool:
    """Capture authorized payment"""
    intent = stripe.PaymentIntent.capture(payment_intent_id)
    return intent.status == "succeeded"


async def refund_order(payment_intent_id: str, amount: int):
    """Process refund"""
    refund = stripe.Refund.create(
        payment_intent=payment_intent_id,
        amount=amount * 100
    )
    return refund


async def pay_provider(provider_id: str, amount: int, order_id: str):
    """Pay provider their earnings"""
    provider = await get_provider(provider_id)
    
    transfer = stripe.Transfer.create(
        amount=amount * 100,
        currency="usd",
        destination=provider.stripe_account_id,
        metadata={
            "order_id": order_id,
            "provider_id": provider_id
        }
    )
    return transfer
```

### 8.3 Subscription Tiers

| Feature | Free | Starter ($49) | Professional ($149) | Enterprise ($499) |
|---------|------|---------------|---------------------|-------------------|
| Bookings/mo | 10 | 100 | 1000 | Unlimited |
| Providers | 1 | 5 | 25 | Unlimited |
| Services | 3 | 15 | 50 | Unlimited |
| Custom branding | No | Yes | Yes | Yes |
| API access | No | No | Yes | Yes |
| Analytics | Basic | Basic | Advanced | Advanced |
| Support | Email | Email | Priority | Phone |
| Transaction fee | 5% | 3% | 2% | 1% |

---

## 9. Multi-Tenancy

### 9.1 Tenant Isolation Strategy

```python
# Row-Level Security Example

class TenantContext:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id


async def get_orders(tenant_id: str, user_id: str = None):
    query = """
        SELECT * FROM orders 
        WHERE tenant_id = :tenant_id
    """
    if user_id:
        query += " AND customer_id = :user_id"
    
    return await db.execute(query, {
        "tenant_id": tenant_id,
        "user_id": user_id
    })


# Middleware to inject tenant
@app.middleware("http")
async def add_tenant_context(request: Request, call_next):
    host = request.headers.get("host", "")
    if ".servicehub.com" in host:
        subdomain = host.split(".servicehub.com")[0]
        tenant = await get_tenant_by_slug(subdomain)
        request.state.tenant_id = tenant.id
    else:
        request.state.tenant_id = request.headers.get("X-Tenant-ID")
    
    response = await call_next(request)
    return response
```

### 9.2 White-Label Configuration

```typescript
interface TenantTheme {
  tenantId: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  
  customDomain?: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  
  emailFromName: string;
  emailFromAddress: string;
}
```

---

## 10. Security

### 10.1 Authentication & Authorization

```python
# JWT Token Structure
class TokenPayload(BaseModel):
    sub: str
    tenant_id: str
    role: UserRole
    type: Literal["access", "refresh"]
    exp: int
    iat: int


ROLES = {
    "SUPER_ADMIN": ["*"],
    "TENANT_ADMIN": [
        "tenant:read", "tenant:write",
        "orders:*", "providers:*", "customers:*",
        "services:*", "reports:*"
    ],
    "PROVIDER": [
        "provider:read", "provider:write",
        "orders:read", "orders:update",
        "earnings:read"
    ],
    "CUSTOMER": [
        "orders:read", "orders:create",
        "wallet:read", "wallet:write",
        "reviews:read", "reviews:create"
    ]
}
```

### 10.2 Data Security

| Aspect | Implementation |
|--------|---------------|
| **Data in Transit** | TLS 1.3, HSTS |
| **Data at Rest** | AES-256 encryption for sensitive fields |
| **Passwords** | Argon2 hashing |
| **API Keys** | Encrypted in database, hashed in logs |
| **PII** | Field-level encryption for phone, address |
| **Backup** | Encrypted daily backups, 30-day retention |

---

## 11. DevOps & Infrastructure

### 11.1 Infrastructure (Recommended)

```
Cloud: AWS or Google Cloud Platform

                           CDN
                    (CloudFront/Cloudflare)
                            |
                     Load Balancer
                        (ALB)
              +-----------+-----------+
              |                       |
   Web App Tier                  API Tier
   (Next.js)                   (FastAPI)
   Auto-scaling                Auto-scaling
   2-10 instances              2-10 instances
              |                       |
              +-----------+-----------+
                          |
                   Redis Cache
                  (ElastiCache)
                          |
                   PostgreSQL
                     (RDS)
          Multi-AZ, Read Replicas (2)
```

### 11.2 CI/CD Pipeline

```yaml
# GitHub Actions - main.yml

name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Tests
        run: |
          docker-compose run --rm api pytest
          docker-compose run --rm web npm test
      
      - name: Security Scan
        run: |
          docker-compose run --rm api safety check
          docker-compose run --rm web npm audit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker images
        run: docker-compose build api web
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker push $ECR_REGISTRY/api:latest
          docker push $ECR_REGISTRY/web:latest

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          aws ecs update-service --cluster staging --service api
          aws ecs update-service --cluster staging --service web
          aws ecs wait services-stable --cluster staging --services api,web

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: |
          aws ecs update-service --cluster production --service api --task-definition api:$(($CURRENT_TASK_VERSION + 1))
          aws ecs wait services-stable --cluster production --services api
```

### 11.3 Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://user:pass@host:6379
JWT_SECRET=your-secret-key
JWT_EXPIRY=3600
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET=servicehub-uploads
ONESIGNAL_APP_ID=xxx
ONESIGNAL_API_KEY=xxx
SENDGRID_API_KEY=xxx

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.servicehub.com/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
NEXT_PUBLIC_ONESIGNAL_APP_ID=xxx
```

---

## 12. Feature Roadmap

### Phase 1: MVP (8-10 weeks)
- User registration & login
- Service browsing (categories, services)
- Provider discovery & profiles
- Booking flow (select service - provider - time - confirm)
- Order management (view, cancel)
- Basic wallet (top-up, credit usage)
- Push notifications (order updates)
- Web landing page

### Phase 2: Core Features (4-6 weeks)
- Provider app (receive jobs, update status, earnings)
- Admin dashboard (tenant management)
- Review & rating system
- Promo codes & discounts
- Multiple addresses
- Order tracking (real-time status)

### Phase 3: Payments & Monetization (3-4 weeks)
- Stripe integration (full payments)
- Subscription tiers
- Provider payouts
- Transaction history
- Invoice generation

### Phase 4: Advanced Features (4-6 weeks)
- Multi-language support
- Referral program
- Package/bundle bookings
- Recurring bookings (weekly, bi-weekly)
- Advanced analytics (tenant dashboard)
- WhatsApp/Chat integration

### Phase 5: Scale & Optimize (Ongoing)
- Performance optimization
- Advanced search (Elasticsearch)
- AI-powered recommendations
- Custom domain support (white-label)
- API for third-party integrations
- Mobile SDK for partners

---

## Appendix A: API Error Codes

| Code | Message | HTTP Status |
|------|---------|-------------|
| AUTH001 | Invalid credentials | 401 |
| AUTH002 | Token expired | 401 |
| AUTH003 | Account locked | 403 |
| AUTH004 | Email not verified | 403 |
| ORDER001 | Slot not available | 400 |
| ORDER002 | Provider unavailable | 400 |
| ORDER003 | Minimum order not met | 400 |
| PAY001 | Payment failed | 402 |
| PAY002 | Insufficient wallet balance | 400 |
| PAY003 | Refund not allowed | 400 |
| SVC001 | Service not found | 404 |
| SVC002 | Service not offered in your area | 400 |
| USR001 | User not found | 404 |
| USR002 | Email already registered | 400 |
| TENANT001 | Tenant not found | 404 |
| TENANT002 | Subscription expired | 403 |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Tenant** | A business (customer of the SaaS) using the platform |
| **Provider** | Service provider (individual or business) |
| **Customer** | End user booking services |
| **ServiceAt** | Location type: home, store, or provider_location |
| **Slot** | Available time window for booking |
| **Credit** | Platform currency in user's wallet |
| **GMV** | Gross Merchandise Value - total transaction value |

---

*Document Version: 1.0*
*Last Updated: 2026-04-01*
*Author: ServiceHub Technical Team*

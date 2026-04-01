# ServiceHub API Documentation

**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** Bearer JWT token in `Authorization` header

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Services](#2-services)
3. [Providers](#3-providers)
4. [Orders](#4-orders)
5. [Payments & Wallet](#5-payments--wallet)
6. [Reviews](#6-reviews)
7. [Users](#7-users)
8. [Tenants](#8-tenants)
9. [Error Codes](#9-error-codes)

---

## 1. Authentication

All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

### Register
```
POST /auth/register
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "phone": "+1234567890",      // optional
  "role": "CUSTOMER"           // optional, default: CUSTOMER
}

Response 201:
{
  "user": { "id", "email", "name", "role" },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

### Login
```
POST /auth/login
Content-Type: application/json

Body:
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response 200:
{
  "user": { "id", "email", "name", "role" },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

Body:
{
  "refresh_token": "<refresh_token>"
}

Response 200:
{
  "accessToken": "<new_jwt>",
  "refreshToken": "<new_jwt>"
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <access_token>

Response 200:
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "CUSTOMER",
    "isActive": true,
    "createdAt": "2026-04-01T12:00:00Z"
  }
}
```

---

## 2. Services

### List Categories
```
GET /services/categories

Response 200:
{
  "categories": [
    {
      "id": "uuid",
      "name": "Cleaning",
      "slug": "cleaning",
      "icon": "sparkles",
      "description": "Home cleaning services",
      "isActive": true
    }
  ]
}
```

### List Services
```
GET /services?category=uuid&search=cleaning&minPrice=10&maxPrice=100&page=1&limit=20

Query Parameters:
- category    (optional) Filter by category UUID
- search      (optional) Search in name/description
- minPrice    (optional) Minimum price filter
- maxPrice    (optional) Maximum price filter
- page        (optional) Page number, default 1
- limit       (optional) Items per page, default 20, max 50

Response 200:
{
  "services": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "name": "Deep Cleaning",
      "description": "Thorough home cleaning",
      "price": 85.00,
      "duration": 180,
      "category": "Cleaning",
      "isActive": true,
      "globalService": {
        "id": "uuid",
        "name": "Deep Cleaning",
        "category": { "id", "name", "slug" }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### Get Service Details
```
GET /services/:id

Response 200:
{
  "service": { ... },
  "providers": [
    {
      "id": "uuid",
      "businessName": "CleanPro",
      "avgRating": 4.8,
      "totalReviews": 124,
      "user": { "id", "name" }
    }
  ]
}
```

---

## 3. Providers

### List Providers
```
GET /providers?service=uuid&search=cleaning&minRating=4&page=1&limit=20

Query Parameters:
- service    (optional) Filter by service UUID
- search     (optional) Search in business name/bio
- minRating  (optional) Minimum rating filter (0-5)
- page       (optional) Page number, default 1
- limit      (optional) Items per page, default 20

Response 200:
{
  "providers": [
    {
      "id": "uuid",
      "businessName": "CleanPro Services",
      "bio": "Professional cleaning with 10+ years experience",
      "profileImage": "https://...",
      "isVerified": true,
      "avgRating": 4.8,
      "totalReviews": 124,
      "completedJobs": 580,
      "serviceRadius": 25,
      "user": { "id", "name", "email" },
      "services": [
        {
          "price": 85.00,
          "duration": 180,
          "tenantService": { "id", "name", "price", "duration" }
        }
      ]
    }
  ],
  "pagination": { ... }
}
```

### Get Provider Details
```
GET /providers/:id

Response 200:
{
  "provider": {
    "id": "uuid",
    "businessName": "CleanPro",
    "bio": "...",
    "profileImage": "...",
    "isVerified": true,
    "avgRating": 4.8,
    "totalReviews": 124,
    "workingHours": { "0": { "start": "09:00", "end": "18:00" }, ... },
    "serviceRadius": 25,
    "user": { "id", "name", "email", "phone" },
    "services": [...],
    "schedules": [
      { "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00", "isAvailable": true }
    ]
  }
}
```

### Get Provider Availability
```
GET /providers/:id/availability?date=2026-04-05

Query Parameters:
- date (required) Date in YYYY-MM-DD format

Response 200:
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

### Get Provider Reviews
```
GET /providers/:id/reviews?page=1&limit=10

Response 200:
{
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Excellent service!",
      "images": [],
      "createdAt": "2026-03-15T...",
      "customer": { "user": { "name": "Sarah" } }
    }
  ],
  "pagination": { ... }
}
```

---

## 4. Orders

### Create Order
```
POST /orders
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "scheduledDate": "2026-04-05",
  "scheduledTime": "10:00",
  "serviceAt": "home",                        // home | store | provider_location
  "address": {                               // required if serviceAt = home
    "lat": 3.139,
    "lng": 101.687,
    "fullAddress": "123 Jalan Utama, Kuala Lumpur",
    "instructions": "Gate code: 1234"
  },
  "items": [
    { "serviceId": "uuid", "quantity": 1 },
    { "serviceId": "uuid", "quantity": 2 }
  ],
  "paymentMethod": "wallet",                  // wallet | card | cash
  "promoCode": "SAVE20",                      // optional
  "providerId": "uuid",                       // optional, auto-assign if omitted
  "notes": "Please bring eco-friendly products"  // optional
}

Response 201:
{
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-20260405-0001",
    "status": "PENDING",
    "scheduledDate": "2026-04-05",
    "scheduledTime": "10:00",
    "subtotal": 170.00,
    "discount": 20.00,
    "total": 150.00,
    "creditUsed": 50.00,
    "cashCollected": 100.00,
    "items": [...],
    "customer": { ... },
    "provider": { ... },
    "placedAt": "2026-04-01T12:00:00Z"
  }
}
```

### List Orders
```
GET /orders?status=COMPLETED&page=1&limit=20
Authorization: Bearer <access_token>

Query Parameters:
- status (optional) PENDING | CONFIRMED | DISPATCHED | IN_PROGRESS | COMPLETED | CANCELLED
- page   (optional) Page number, default 1
- limit  (optional) Items per page, default 20

Notes:
- CUSTOMER role sees only their own orders
- PROVIDER role sees only their assigned orders
- TENANT_ADMIN sees all orders in their tenant

Response 200:
{
  "orders": [...],
  "pagination": { ... }
}
```

### Get Order Details
```
GET /orders/:id
Authorization: Bearer <access_token>

Response 200:
{
  "order": {
    "id": "uuid",
    "orderNumber": "ORD-20260405-0001",
    "status": "CONFIRMED",
    "scheduledDate": "2026-04-05",
    "scheduledTime": "10:00",
    "serviceAt": "home",
    "address": { ... },
    "subtotal": 170.00,
    "discount": 20.00,
    "total": 150.00,
    "creditUsed": 50.00,
    "cashCollected": 100.00,
    "notes": "...",
    "placedAt": "...",
    "confirmedAt": "...",
    "items": [
      {
        "id": "uuid",
        "tenantServiceId": "uuid",
        "price": 85.00,
        "duration": 180,
        "quantity": 2,
        "tenantService": { "name": "Deep Cleaning" }
      }
    ],
    "customer": { "user": { "name", "email", "phone" } },
    "provider": { "user": { "name", "phone" }, "businessName" },
    "payment": { "amount": 150.00, "type": "card", "status": "completed" }
  }
}
```

### Update Order Status
```
PATCH /orders/:id/status
Authorization: Bearer <access_token> (PROVIDER or TENANT_ADMIN only)
Content-Type: application/json

Body:
{
  "status": "CONFIRMED"   // CONFIRMED | DISPATCHED | IN_PROGRESS | COMPLETED
}

Response 200:
{ "order": { ... updated order ... } }
```

### Cancel Order
```
PATCH /orders/:id/cancel
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "reason": "Changed plans"   // optional
}

Response 200:
{ "order": { ... updated order ... } }

Notes:
- Only PENDING or CONFIRMED orders can be cancelled
- Wallet credit is automatically refunded
```

---

## 5. Payments & Wallet

### Get Wallet Balance
```
GET /wallet/balance
Authorization: Bearer <access_token>

Response 200:
{
  "balance": 125.50,
  "currency": "USD"
}
```

### Get Wallet Transactions
```
GET /wallet/transactions
Authorization: Bearer <access_token>

Response 200:
{
  "transactions": [
    {
      "id": "uuid",
      "type": "topup",
      "amount": 100.00,
      "description": "Wallet top-up",
      "createdAt": "2026-04-01T12:00:00Z"
    },
    {
      "id": "uuid",
      "type": "order_payment",
      "amount": -85.00,
      "description": "Payment for ORD-20260405-0001",
      "createdAt": "2026-04-01T13:00:00Z"
    }
  ]
}
```

### Top Up Wallet (Create Stripe PaymentIntent)
```
POST /wallet/topup
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "amount": 100.00    // minimum 1.00
}

Response 200:
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 100.00
}

Notes:
- Use clientSecret with Stripe.js to complete payment
- Call POST /payments/confirm after successful payment
```

### Create Order Payment Intent
```
POST /payments/stripe-intent
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "orderId": "uuid",
  "amount": 100.00    // amount in USD
}

Response 200:
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### Confirm Payment
```
POST /payments/confirm
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "paymentIntentId": "pi_xxx",
  "type": "wallet_topup",     // wallet_topup | order_payment
  "customerId": "uuid",        // required for wallet_topup
  "orderId": "uuid",           // required for order_payment
  "amount": 100.00
}

Response 200:
{ "success": true }
```

### Refund
```
POST /payments/refund
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "orderId": "uuid"
}

Response 200:
{ "success": true, "message": "Refund processed" }
```

---

## 6. Reviews

### Create Review
```
POST /reviews
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "orderId": "uuid",
  "rating": 5,                  // 1-5
  "comment": "Great service!",  // optional
  "images": ["url1", "url2"]    // optional, array of image URLs
}

Response 201:
{ "review": { ... } }

Notes:
- Can only review orders that are COMPLETED
- One review per order
- Only the customer who placed the order can review
- Provider rating is automatically updated
```

### Get Provider Reviews
```
GET /reviews/provider/:providerId?page=1&limit=10

Response 200:
{
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Excellent service!",
      "images": [],
      "createdAt": "2026-03-15T...",
      "customer": { "user": { "name": "Sarah M." } }
    }
  ],
  "pagination": { ... }
}
```

---

## 7. Users

### Get Profile
```
GET /users/me
Authorization: Bearer <access_token>

Response 200:
{
  "user": { "id", "email", "name", "phone", "role", "isActive", "createdAt" },
  "profile": {
    // CUSTOMER: { id, defaultAddress, creditBalance, ... }
    // PROVIDER: { id, businessName, bio, avgRating, ... }
  }
}
```

### Update Profile
```
PATCH /users/me
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "name": "John Doe",
  "phone": "+1234567890"
}

Response 200:
{ "user": { ... } }
```

### Get Saved Addresses
```
GET /users/addresses
Authorization: Bearer <access_token>

Response 200:
{
  "addresses": [
    {
      "lat": 3.139,
      "lng": 101.687,
      "fullAddress": "123 Jalan Utama",
      "instructions": "Gate code: 1234"
    }
  ]
}
```

### Add/Update Address
```
POST /users/addresses
Authorization: Bearer <access_token>
Content-Type: application/json

Body:
{
  "address": {
    "lat": 3.139,
    "lng": 101.687,
    "fullAddress": "123 Jalan Utama, Kuala Lumpur",
    "instructions": "Call upon arrival"
  }
}

Response 200:
{ "success": true, "address": { ... } }
```

---

## 8. Tenants

### Get Tenant
```
GET /tenants/:id

Response 200:
{
  "tenant": {
    "id": "uuid",
    "name": "CleanCo Malaysia",
    "slug": "cleanco-my",
    "logo": "https://...",
    "primaryColor": "#0066CC",
    "plan": "PROFESSIONAL",
    "isActive": true
  }
}
```

### Get Tenant Services
```
GET /tenants/:id/services

Response 200:
{
  "services": [
    {
      "id": "uuid",
      "name": "Deep Cleaning",
      "price": 85.00,
      "duration": 180,
      "category": "Cleaning",
      "globalService": { "id", "name", "category": { "name" } }
    }
  ]
}
```

### Get Tenant Settings
```
GET /tenants/:id/settings
Authorization: Bearer <access_token>

Response 200:
{
  "settings": {
    "bookingLeadTime": 60,
    "maxAdvanceDays": 30,
    "workingHours": { ... },
    "serviceRadius": 25,
    "currency": "USD",
    "timezone": "UTC",
    "emailNotifications": true,
    "pushNotifications": true
  }
}
```

---

## 9. Error Codes

### Authentication Errors (AUTH*)
| Code | HTTP | Message |
|------|------|---------|
| AUTH001 | 401 | Invalid credentials / Missing authorization |
| AUTH002 | 401 | Token expired / Invalid token |
| AUTH003 | 403 | Account locked / Insufficient permissions |

### User Errors (USR*)
| Code | HTTP | Message |
|------|------|---------|
| USR001 | 404 | User not found |
| USR002 | 400 | Email already registered |

### Order Errors (ORD*)
| Code | HTTP | Message |
|------|------|---------|
| ORD001 | 404/400 | Order not found / Service unavailable |
| ORD002 | 400 | Provider unavailable |
| ORD003 | 400 | Order cannot be cancelled |

### Payment Errors (PAY*)
| Code | HTTP | Message |
|------|------|---------|
| PAY001 | 400 | No Stripe payment found |
| PAY002 | 402 | Payment failed / Insufficient balance |
| PAY003 | 400 | Refund not allowed |

### Service Errors (SVC*)
| Code | HTTP | Message |
|------|------|---------|
| SVC001 | 404 | Service not found |
| SVC002 | 400 | Service not offered in your area |

### Provider Errors (PRV*)
| Code | HTTP | Message |
|------|------|---------|
| PRV001 | 404 | Provider not found |

### Review Errors (REV*)
| Code | HTTP | Message |
|------|------|---------|
| REV001 | 400 | Can only review completed orders |
| REV002 | 400 | Order already reviewed |
| REV003 | 400 | No provider assigned |

### Tenant Errors (TEN*)
| Code | HTTP | Message |
|------|------|---------|
| TEN001 | 404 | Tenant not found |
| TEN002 | 403 | Subscription expired |

### Customer Errors (CUST*)
| Code | HTTP | Message |
|------|------|---------|
| CUST001 | 404 | Customer profile not found |

### Validation Errors
| Code | HTTP | Message |
|------|------|---------|
| VALIDATION_ERROR | 400 | Request validation failed (details in response) |

---

## Response Format

All responses follow this structure:

### Success
```json
{
  "data": { ... }  // or directly the resource
}
```

### Error
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": [...]   // optional, for validation errors
}
```

### Pagination
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Rate Limiting

| Tier | Requests/minute |
|------|-----------------|
| Free | 60 |
| Starter | 300 |
| Professional | 1000 |
| Enterprise | Unlimited |

---

## Webhooks (Future)

Configure Stripe webhooks at `POST /webhooks/stripe` for real-time payment events.

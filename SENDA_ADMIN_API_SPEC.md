# SENDA Admin Dashboard — Backend API Specification

> **Version:** 1.0.0  
> **Status:** Ready for Implementation  
> **Audience:** Backend Engineers  
> **Frontend file:** `senda-dashboard.jsx`  
> **Base URL (production):** `https://api.senda.co.tz/admin/v1`  
> **Base URL (staging):** `https://staging-api.senda.co.tz/admin/v1`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication](#2-authentication)
3. [Global Conventions](#3-global-conventions)
4. [Dashboard Overview & KPIs](#4-dashboard-overview--kpis)
5. [Users Management](#5-users-management)
6. [Transactions](#6-transactions)
7. [Sender IDs](#7-sender-ids)
8. [Partners](#8-partners)
9. [Login Activity](#9-login-activity)
10. [SMS Packages](#10-sms-packages)
11. [Real-Time Data (WebSocket / SSE)](#11-real-time-data-websocket--sse)
12. [Database Schema Reference](#12-database-schema-reference)
13. [Security Requirements](#13-security-requirements)
14. [Error Codes Reference](#14-error-codes-reference)
15. [Frontend Integration Guide](#15-frontend-integration-guide)

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                  SENDA Admin Frontend                       │
│              (senda-dashboard.jsx — React)                  │
└───────────────────┬────────────────────────────────────────┘
                    │  HTTPS + JWT Bearer Token
                    │  WebSocket (wss://) for real-time
                    ▼
┌────────────────────────────────────────────────────────────┐
│               Admin API Gateway                             │
│        (Rate limited · CORS restricted · HTTPS only)        │
│              Base: /admin/v1/                               │
└───────┬───────────────────┬──────────────────┬─────────────┘
        │                   │                  │
        ▼                   ▼                  ▼
  Auth Service       Core API Service     Analytics Service
  (JWT + sessions)   (REST endpoints)     (aggregations, charts)
        │                   │                  │
        └───────────────────┴──────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   PostgreSQL Database    │
              │   Redis (caching/rate)   │
              │   S3 / Storage (docs)    │
              └─────────────────────────┘
```

### Tech Stack Recommendation
| Layer | Recommended | Alternative |
|---|---|---|
| Runtime | Node.js 20 LTS | Python (FastAPI) |
| Framework | Express.js / Fastify | NestJS |
| Database | PostgreSQL 15+ | MySQL 8+ |
| Cache | Redis 7+ | — |
| Auth | JWT (access + refresh) | Session-based |
| Real-time | Socket.IO / native WS | Server-Sent Events |
| Queue | Bull (Redis) | RabbitMQ |
| Docs | Swagger/OpenAPI 3.0 | — |

---

## 2. Authentication

### 2.1 Admin Login

The dashboard uses a dedicated admin auth endpoint separate from regular user login.

**`POST /auth/admin/login`**

Request:
```json
{
  "email":    "admin@senda.co.tz",
  "password": "string"
}
```

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "access_token":  "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "expires_in":    28800,
    "token_type":    "Bearer",
    "admin": {
      "id":         "ADM-00001",
      "email":      "admin@senda.co.tz",
      "name":       "System Admin",
      "role":       "super_admin",
      "last_login": "2026-04-17T08:00:00Z",
      "avatar_url": null
    }
  }
}
```

Response `401 Unauthorized`:
```json
{
  "success": false,
  "error": {
    "code":    "INVALID_CREDENTIALS",
    "message": "Invalid credentials. Please try again."
  }
}
```

> **Implementation notes:**
> - Hash passwords with **bcrypt** (rounds ≥ 12) — never store plaintext
> - Access token TTL: **8 hours** (matching frontend session expiry in `localStorage`)
> - Refresh token TTL: **30 days**, stored as `HttpOnly` cookie
> - Log every login attempt to `login_activity` table (see §9)
> - Lock account after **5 consecutive failed attempts** for 15 minutes
> - Only accounts with `role IN ('admin', 'super_admin')` may use this endpoint

---

### 2.2 Token Refresh

**`POST /auth/admin/refresh`**

Reads `refresh_token` from `HttpOnly` cookie automatically.

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in":   28800
  }
}
```

---

### 2.3 Logout

**`POST /auth/admin/logout`**

Headers: `Authorization: Bearer <access_token>`

Response `200 OK`:
```json
{ "success": true, "message": "Logged out successfully." }
```

> Invalidates the refresh token in the database; frontend clears `localStorage`.

---

### 2.4 Auth Headers (All Protected Endpoints)

Every request to a protected endpoint **must** include:
```
Authorization: Bearer <access_token>
Content-Type:  application/json
```

A missing or expired token returns `401`. A valid token with insufficient role returns `403`.

---

### 2.5 Role Matrix

| Role | Access |
|---|---|
| `super_admin` | Full access — all endpoints including delete |
| `admin` | Read/write all; cannot delete packages or demote other admins |
| `support` | Read-only on all resources; can update sender ID notes |

---

## 3. Global Conventions

### Request Pagination (all list endpoints)

Query parameters:
```
?page=1        (default: 1)
?limit=20      (default: 20, max: 100)
?sort=created_at   (field name)
?order=desc    (asc | desc)
```

### Standard List Response Envelope
```json
{
  "success": true,
  "data": [ ...items ],
  "meta": {
    "total":        150,
    "page":         1,
    "limit":        20,
    "total_pages":  8,
    "has_next":     true,
    "has_prev":     false
  }
}
```

### Standard Single-Object Response Envelope
```json
{
  "success": true,
  "data":    { ...item }
}
```

### Date & Time Format
- All timestamps: **ISO 8601 UTC** — `"2026-04-17T10:30:00Z"`
- All date-only fields: `"2026-04-17"`
- Timezone: server stores in UTC; frontend converts to `Africa/Dar_es_Salaam` for display

### Currency
- All monetary values: **integer in TZS (Tanzanian Shilling)** — no decimals
- Example: `42000` = TZS 42,000

---

## 4. Dashboard Overview & KPIs

This module powers the **Overview tab** — stat cards, 6 chart series, and network performance.

---

### 4.1 KPI Summary Cards

**`GET /analytics/summary`**

Query: `?period=current_month` (options: `today`, `current_month`, `last_month`, `current_year`)

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "period": "current_year",
    "generated_at": "2026-04-17T10:00:00Z",
    "stats": {
      "total_users": {
        "value":  1547,
        "change": 12.4,
        "change_direction": "up",
        "description": "Total registered users"
      },
      "active_users": {
        "value":  1289,
        "change": 8.7,
        "change_direction": "up",
        "description": "Active this month"
      },
      "sms_sent": {
        "value":  876500,
        "change": 18.2,
        "change_direction": "up",
        "description": "SMS sent this year"
      },
      "revenue_tzs": {
        "value":  25700000,
        "change": 21.5,
        "change_direction": "up",
        "description": "Total revenue (TZS)"
      },
      "approved_sender_ids": {
        "value":  117,
        "change": 5,
        "change_direction": "up",
        "description": "Approved sender IDs"
      },
      "delivery_fail_rate": {
        "value":  3.28,
        "change": -0.4,
        "change_direction": "down",
        "description": "Delivery failure rate (%)"
      },
      "avg_delivery_time_seconds": {
        "value":  1.8,
        "change": -0.3,
        "change_direction": "down",
        "description": "Avg delivery time"
      },
      "pending_sender_id_approvals": {
        "value":  8,
        "change": 2,
        "change_direction": "up",
        "description": "Pending sender IDs"
      }
    }
  }
}
```

> **Cache TTL:** 5 minutes (Redis). Bust on any write to users/transactions/sender_ids tables.

---

### 4.2 Monthly SMS Volume

**`GET /analytics/sms/monthly`**

Query: `?year=2026`

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "month":     "Jan",
      "year":      2026,
      "sent":      42000,
      "delivered": 39500,
      "failed":    1800,
      "pending":   700,
      "delivery_rate": 94.05
    }
  ]
}
```

> Returns 12 objects (Jan–Dec). Missing months return zeros. Used by the **SMS Volume & Delivery Analysis** ComposedChart.

---

### 4.3 Monthly Revenue

**`GET /analytics/revenue/monthly`**

Query: `?year=2026`

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "month":      "Jan",
      "year":       2026,
      "revenue":    1280000,
      "packages":   42,
      "avg_order":  30476
    }
  ]
}
```

---

### 4.4 User Growth

**`GET /analytics/users/growth`**

Query: `?year=2026`

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "month":   "Jan",
      "year":    2026,
      "users":   310,
      "active":  240,
      "churned": 18,
      "new_signups": 70,
      "retention_rate": 92.9
    }
  ]
}
```

---

### 4.5 Delivery Status (Current Period Pie)

**`GET /analytics/sms/delivery-status`**

Query: `?period=current_month`

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "period": "2026-04",
    "total":  115000,
    "breakdown": [
      { "status": "delivered", "value": 110500, "percentage": 96.09 },
      { "status": "failed",    "value": 3800,   "percentage": 3.30  },
      { "status": "pending",   "value": 700,    "percentage": 0.61  }
    ]
  }
}
```

---

### 4.6 Network Performance

**`GET /analytics/networks/performance`**

Query: `?period=current_month`

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "network":       "Vodacom",
      "delivery_rate": 97.2,
      "volume":        48000,
      "failed":        1344,
      "avg_time_sec":  1.6
    },
    {
      "network":       "Airtel",
      "delivery_rate": 95.8,
      "volume":        31000,
      "failed":        1302,
      "avg_time_sec":  1.9
    },
    {
      "network":       "Tigo",
      "delivery_rate": 96.1,
      "volume":        22000,
      "failed":        858,
      "avg_time_sec":  1.8
    },
    {
      "network":       "Halotel",
      "delivery_rate": 94.3,
      "volume":        9000,
      "failed":        513,
      "avg_time_sec":  2.1
    },
    {
      "network":       "TTCL",
      "delivery_rate": 93.7,
      "volume":        5000,
      "failed":        315,
      "avg_time_sec":  2.4
    }
  ]
}
```

---

### 4.7 Delivery Rate Trend (with Moving Average)

**`GET /analytics/sms/delivery-rate-trend`**

Query: `?year=2026&ma_window=3`

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "month":         "Jan",
      "delivery_rate": 94.05,
      "moving_avg_3":  null
    },
    {
      "month":         "Feb",
      "delivery_rate": 94.51,
      "moving_avg_3":  null
    },
    {
      "month":         "Mar",
      "delivery_rate": 94.53,
      "moving_avg_3":  94.36
    }
  ]
}
```

> Backend computes the moving average. `moving_avg_3` is `null` for months with fewer than `ma_window` data points before them.

---

## 5. Users Management

### 5.1 List Users

**`GET /users`**

Query parameters:
```
?search=alice           (name or email — partial match)
?role=admin             (admin | partner | user)
?status=active          (active | suspended)
?page=1
?limit=20
?sort=joined_at&order=desc
```

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id":          "USR-01001",
      "name":        "Alice Mwanga",
      "email":       "alice@gmail.com",
      "phone":       "+255712345678",
      "role":        "user",
      "status":      "active",
      "sms_sent":    2340,
      "balance":     12500,
      "joined_at":   "2026-01-15T09:00:00Z",
      "last_seen_at":"2026-04-16T14:22:00Z"
    }
  ],
  "meta": { "total": 1547, "page": 1, "limit": 20, "total_pages": 78 }
}
```

---

### 5.2 Get Single User

**`GET /users/:id`**

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id":           "USR-01001",
    "name":         "Alice Mwanga",
    "email":        "alice@gmail.com",
    "phone":        "+255712345678",
    "role":         "user",
    "status":       "active",
    "sms_sent":     2340,
    "balance":      12500,
    "joined_at":    "2026-01-15T09:00:00Z",
    "last_seen_at": "2026-04-16T14:22:00Z",
    "sender_ids_count": 2,
    "transactions_count": 5,
    "total_spent":  60000
  }
}
```

---

### 5.3 Update User Status

**`PATCH /users/:id/status`**

Request:
```json
{
  "status": "suspended",
  "reason": "Violation of terms of service — spam activity"
}
```

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id":     "USR-01001",
    "status": "suspended",
    "updated_at": "2026-04-17T10:00:00Z"
  }
}
```

> Valid values: `"active"`, `"suspended"`. Suspending a user must immediately invalidate all their active sessions.

---

### 5.4 Update User Role

**`PATCH /users/:id/role`**  
**Requires:** `role = super_admin`

Request:
```json
{
  "role": "partner"
}
```

Valid roles: `"user"`, `"partner"`, `"admin"`, `"super_admin"`

Response `200 OK`:
```json
{
  "success": true,
  "data": { "id": "USR-01001", "role": "partner" }
}
```

---

## 6. Transactions

### 6.1 List Transactions

**`GET /transactions`**

Query parameters:
```
?search=TXN-10001       (ID, user email, ref)
?status=completed       (completed | pending | failed)
?method=M-Pesa          (M-Pesa | Tigo Pesa | Airtel Money | Bank Transfer)
?date_from=2026-01-01
?date_to=2026-04-17
?page=1&limit=10
?sort=date&order=desc
```

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id":         "TXN-10001",
      "user_id":    "USR-01001",
      "user_email": "user1@gmail.com",
      "package":    "Pro 5000",
      "amount":     42000,
      "credits":    5000,
      "method":     "M-Pesa",
      "status":     "completed",
      "date":       "2026-04-10",
      "ref":        "REFAB12CD34",
      "created_at": "2026-04-10T08:45:00Z"
    }
  ],
  "meta": { "total": 300, "page": 1, "limit": 10, "total_pages": 30 },
  "summary": {
    "total_count":     300,
    "completed_count": 262,
    "pending_count":   24,
    "failed_count":    14,
    "total_revenue":   9870000
  }
}
```

> The `summary` block is always returned regardless of active filters, to keep the summary cards accurate.

---

### 6.2 Get Single Transaction

**`GET /transactions/:id`**

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id":         "TXN-10001",
    "user_id":    "USR-01001",
    "user_email": "user1@gmail.com",
    "user_name":  "Alice Mwanga",
    "package_id": "PKG-003",
    "package":    "Pro 5000",
    "amount":     42000,
    "credits":    5000,
    "method":     "M-Pesa",
    "status":     "completed",
    "date":       "2026-04-10",
    "ref":        "REFAB12CD34",
    "gateway_ref":"MPESA-TXN-XYZABC",
    "created_at": "2026-04-10T08:45:00Z",
    "updated_at": "2026-04-10T08:46:12Z",
    "notes":      null
  }
}
```

---

### 6.3 Approve a Pending Transaction

**`POST /transactions/:id/approve`**

Request body: _(empty)_

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id":     "TXN-10001",
    "status": "completed",
    "credits_credited": 5000,
    "updated_at": "2026-04-17T10:05:00Z"
  }
}
```

> Must atomically: set status → `completed`, add `credits` to the user's balance.

---

### 6.4 Refund a Transaction

**`POST /transactions/:id/refund`**

Request:
```json
{
  "reason": "Duplicate charge confirmed by customer"
}
```

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id":            "TXN-10001",
    "status":        "refunded",
    "refund_ref":    "REF-RFD-00042",
    "credits_reversed": 5000,
    "updated_at":    "2026-04-17T10:06:00Z"
  }
}
```

> Must atomically deduct the credited SMS credits from the user's balance. If credits already consumed, log a debt.

---

## 7. Sender IDs

### 7.1 Status Definitions

| Status | Code | Meaning | Next allowed statuses |
|---|---|---|---|
| Pending Review | `pending` | Submitted, awaiting admin action | `approved`, `require_changes`, `rejected` |
| Await Payment | `await_payment` | Invoice issued, waiting for payment | `approved`, `rejected` |
| Approved | `approved` | Live and active on network | `await_payment`, `rejected` |
| Rejected | `rejected` | Declined | `approved`, `pending` |
| Require Changes | `require_changes` | Admin requested document changes | `approved`, `rejected` |

---

### 7.2 List Sender IDs

**`GET /sender-ids`**

Query parameters:
```
?search=SENDA           (name, owner email, company, ID)
?status=pending         (pending | await_payment | approved | rejected | require_changes)
?type=promotional       (promotional | transactional)
?network=Vodacom        (Vodacom | Airtel | Tigo | All Networks)
?page=1&limit=20
?sort=created_at&order=desc
```

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id":          "SID-1001",
      "name":        "SENDA",
      "owner_id":    "USR-01001",
      "owner_email": "business1@company1.co.tz",
      "company":     "Senda Ltd",
      "status":      "approved",
      "type":        "Transactional",
      "network":     "All Networks",
      "purpose":     "OTP & Alerts",
      "sms_count":   45200,
      "invoice_no":  null,
      "notes":       null,
      "created_at":  "2026-03-01T09:00:00Z",
      "updated_at":  "2026-03-05T11:00:00Z"
    }
  ],
  "meta": { "total": 117, "page": 1, "limit": 20 },
  "summary": {
    "total":            117,
    "approved":         89,
    "pending":          11,
    "await_payment":    5,
    "require_changes":  4,
    "rejected":         8
  }
}
```

---

### 7.3 Get Single Sender ID

**`GET /sender-ids/:id`**

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id":          "SID-1001",
    "name":        "SENDA",
    "owner_id":    "USR-01001",
    "owner_email": "business1@company1.co.tz",
    "owner_name":  "Alice Mwanga",
    "company":     "Senda Ltd",
    "status":      "approved",
    "type":        "Transactional",
    "network":     "All Networks",
    "purpose":     "OTP & Alerts",
    "sms_count":   45200,
    "invoice_no":  null,
    "notes":       null,
    "documents":   [],
    "status_history": [
      { "status": "pending",  "changed_at": "2026-03-01T09:00:00Z", "changed_by": null },
      { "status": "approved", "changed_at": "2026-03-05T11:00:00Z", "changed_by": "ADM-00001" }
    ],
    "created_at":  "2026-03-01T09:00:00Z",
    "updated_at":  "2026-03-05T11:00:00Z"
  }
}
```

---

### 7.4 Update Sender ID Status

**`PATCH /sender-ids/:id/status`**

This is the **core action endpoint**. It handles all 5 status transitions.

Request:
```json
{
  "status": "require_changes",
  "notes":  "Please submit an updated business registration certificate issued within the last 12 months.",
  "invoice_no": null
}
```

| `status` | `notes` | `invoice_no` | Behaviour |
|---|---|---|---|
| `approved` | optional | optional | Activates sender ID on network |
| `pending` | optional | — | Re-queues for review |
| `await_payment` | optional | **required** | Issues invoice, notifies user |
| `rejected` | **required** | — | Sends rejection email to owner |
| `require_changes` | **required** | — | Sends change-request email to owner |

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id":         "SID-1001",
    "status":     "require_changes",
    "notes":      "Please submit an updated business registration certificate...",
    "updated_at": "2026-04-17T10:10:00Z"
  }
}
```

Response `422 Unprocessable Entity` (invalid transition):
```json
{
  "success": false,
  "error": {
    "code":    "INVALID_STATUS_TRANSITION",
    "message": "Cannot transition from 'approved' to 'pending' directly.",
    "allowed": ["await_payment", "rejected"]
  }
}
```

> **Side effects the backend must handle:**
> - Send email notification to `owner_email` on every status change
> - Email templates by status:
>   - `approved` → "Your sender ID {name} has been approved"
>   - `rejected` → "Your sender ID {name} was rejected: {notes}"
>   - `require_changes` → "Changes required for {name}: {notes}"
>   - `await_payment` → "Invoice {invoice_no} for {name} is ready"
> - Log transition to `sender_id_history` table

---

### 7.5 Update Sender ID Notes (standalone)

**`PATCH /sender-ids/:id/notes`**

Use this to update change-request feedback without changing status.

Request:
```json
{
  "notes": "Updated requirement: also provide a board resolution letter."
}
```

Response `200 OK`:
```json
{
  "success": true,
  "data": { "id": "SID-1001", "notes": "Updated requirement: ...", "updated_at": "..." }
}
```

---

### 7.6 Create Sender ID (Admin-initiated)

**`POST /sender-ids`**

Request:
```json
{
  "name":       "NEWBRAND",
  "owner_id":   "USR-01001",
  "company":    "New Brand Ltd",
  "type":       "Promotional",
  "network":    "All Networks",
  "purpose":    "Marketing",
  "status":     "pending"
}
```

Response `201 Created`:
```json
{
  "success": true,
  "data": { "id": "SID-1026", "name": "NEWBRAND", "status": "pending", "created_at": "..." }
}
```

---

## 8. Partners

### 8.1 List Partners

**`GET /partners`**

Query parameters:
```
?search=NexaComm        (name, email, region)
?status=active          (active | pending | suspended)
?tier=Gold              (Silver | Gold | Platinum)
?region=Arusha
?page=1&limit=20
?sort=revenue&order=desc
```

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id":          "PTR-3001",
      "name":        "NexaComm",
      "contact":     "partner1@agency1.co.tz",
      "phone":       "+255712999001",
      "region":      "Dar es Salaam",
      "status":      "active",
      "tier":        "Gold",
      "clients":     22,
      "sms_sent":    187400,
      "revenue":     3720000,
      "commission":  372000,
      "api_key":     "pk_live_a1b2c3d4e5f6g7h8",
      "join_date":   "2025-10-15",
      "created_at":  "2025-10-15T10:00:00Z"
    }
  ],
  "meta": { "total": 18, "page": 1, "limit": 20 },
  "summary": {
    "total":            18,
    "active":           14,
    "pending":          3,
    "suspended":        1,
    "total_revenue":    67400000,
    "total_commission": 6740000,
    "total_clients":    314,
    "total_sms_sent":   2840000
  }
}
```

---

### 8.2 Create Partner

**`POST /partners`**

Request:
```json
{
  "name":    "NewAgency Ltd",
  "contact": "contact@newagency.co.tz",
  "phone":   "+255712000000",
  "region":  "Mwanza",
  "tier":    "Silver",
  "status":  "pending"
}
```

Response `201 Created`:
```json
{
  "success": true,
  "data": {
    "id":      "PTR-3019",
    "name":    "NewAgency Ltd",
    "status":  "pending",
    "tier":    "Silver",
    "api_key": "pk_live_newlygenerated1234",
    "created_at": "2026-04-17T10:00:00Z"
  }
}
```

> Backend must **auto-generate** a unique `api_key` prefixed `pk_live_` (32 random hex chars). Store only the **hash** in DB; return plaintext once at creation.

---

### 8.3 Update Partner

**`PUT /partners/:id`**

Request — send only fields to update:
```json
{
  "name":   "NexaComm Tanzania",
  "tier":   "Platinum",
  "region": "Dar es Salaam",
  "phone":  "+255712999002"
}
```

Response `200 OK`:
```json
{
  "success": true,
  "data": { "id": "PTR-3001", "name": "NexaComm Tanzania", "tier": "Platinum", "updated_at": "..." }
}
```

---

### 8.4 Update Partner Status

**`PATCH /partners/:id/status`**

Request:
```json
{
  "status": "suspended",
  "reason": "Fraudulent activity reported"
}
```

Valid: `"active"`, `"pending"`, `"suspended"`

Response `200 OK`:
```json
{
  "success": true,
  "data": { "id": "PTR-3001", "status": "suspended", "updated_at": "..." }
}
```

> Suspending a partner must immediately revoke their `api_key` — reject all API calls using that key.

---

### 8.5 Delete Partner

**`DELETE /partners/:id`**  
**Requires:** `role = super_admin`

Response `200 OK`:
```json
{ "success": true, "message": "Partner PTR-3001 deleted." }
```

---

### 8.6 Regenerate Partner API Key

**`POST /partners/:id/regenerate-key`**

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "id":      "PTR-3001",
    "api_key": "pk_live_newkey9876543210abcdef",
    "message": "Previous key is immediately invalidated."
  }
}
```

---

### 8.7 Partner Revenue Trend

**`GET /partners/analytics/revenue-trend`**

Query: `?months=6`

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "month":      "Jul",
      "year":       2025,
      "revenue":    3200000,
      "commission": 320000,
      "clients":    28
    },
    {
      "month":      "Aug",
      "year":       2025,
      "revenue":    3900000,
      "commission": 390000,
      "clients":    32
    }
  ]
}
```

---

### 8.8 Partner Tier Distribution

**`GET /partners/analytics/tier-distribution`**

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    { "tier": "Platinum", "count": 3 },
    { "tier": "Gold",     "count": 6 },
    { "tier": "Silver",   "count": 9 }
  ]
}
```

---

## 9. Login Activity

### 9.1 List Login Activity

**`GET /auth/activity`**

Query parameters:
```
?search=alice           (user email, IP, location)
?status=success         (success | failed)
?role=user              (admin | user | partner)
?date_from=2026-04-01
?date_to=2026-04-17
?page=1&limit=25
?sort=time&order=desc
```

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id":       "LOG-05001",
      "user_id":  "ADM-00001",
      "user":     "admin@senda.co.tz",
      "ip":       "196.216.1.45",
      "device":   "Chrome / Windows",
      "location": "Dar es Salaam",
      "status":   "success",
      "role":     "admin",
      "time":     "2026-04-17T08:00:00Z"
    }
  ],
  "meta": { "total": 250, "page": 1, "limit": 25 },
  "summary": {
    "total":        250,
    "success":      231,
    "failed":       19,
    "success_rate": 92.4,
    "unique_ips":   87
  }
}
```

---

### 9.2 Login Activity Daily Breakdown (Chart)

**`GET /auth/activity/daily`**

Query: `?days=7`

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    { "date": "2026-04-11", "success": 18, "failed": 2 },
    { "date": "2026-04-12", "success": 22, "failed": 1 },
    { "date": "2026-04-13", "success": 15, "failed": 3 }
  ]
}
```

---

### 9.3 Block an IP Address

**`POST /auth/activity/block-ip`**

Request:
```json
{
  "ip":     "196.216.1.45",
  "reason": "Multiple failed login attempts from this IP"
}
```

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "ip":        "196.216.1.45",
    "blocked":   true,
    "expires_at":"2026-05-17T10:00:00Z"
  }
}
```

> Default block duration: **30 days**. Blocked IPs receive `403 Forbidden` on any request. Store in `blocked_ips` table and Redis for fast lookup.

---

### 9.4 Unblock an IP Address

**`DELETE /auth/activity/block-ip/:ip`**

Response `200 OK`:
```json
{ "success": true, "message": "IP 196.216.1.45 unblocked." }
```

---

## 10. SMS Packages

### 10.1 List All Packages

**`GET /packages`**

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id":       "PKG-001",
      "name":     "Starter",
      "credits":  500,
      "price":    5000,
      "per_sms":  10.00,
      "popular":  false,
      "color":    "#64748b",
      "desc":     "Perfect for individuals & small tests",
      "active":   true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 10.2 Create Package

**`POST /packages`**

Request:
```json
{
  "name":    "Mega",
  "credits": 100000,
  "price":   650000,
  "per_sms": 6.5,
  "popular": false,
  "color":   "#0ea5e9",
  "desc":    "For enterprise bulk campaigns"
}
```

Response `201 Created`:
```json
{
  "success": true,
  "data": { "id": "PKG-007", "name": "Mega", "created_at": "..." }
}
```

---

### 10.3 Update Package

**`PUT /packages/:id`**

Request — any subset of package fields:
```json
{
  "price":   38000,
  "per_sms": 7.6,
  "popular": true
}
```

Response `200 OK`:
```json
{
  "success": true,
  "data": { "id": "PKG-003", "price": 38000, "per_sms": 7.6, "popular": true, "updated_at": "..." }
}
```

---

### 10.4 Delete Package

**`DELETE /packages/:id`**  
**Requires:** `role = super_admin`

Response `200 OK`:
```json
{ "success": true, "message": "Package PKG-007 deleted." }
```

> **Constraint:** Cannot delete a package that has associated transactions. Return `409 Conflict` with:
> ```json
> { "error": { "code": "PACKAGE_IN_USE", "message": "Package has 12 associated transactions and cannot be deleted. Deactivate it instead." } }
> ```

---

### 10.5 Toggle Package Active State

**`PATCH /packages/:id/active`**

Request:
```json
{ "active": false }
```

Response `200 OK`:
```json
{ "success": true, "data": { "id": "PKG-007", "active": false } }
```

---

### 10.6 Package Analytics (Comparison Chart Data)

**`GET /packages/analytics`**

Response `200 OK`:
```json
{
  "success": true,
  "data": [
    {
      "id":           "PKG-001",
      "name":         "Starter",
      "credits":      500,
      "price":        5000,
      "per_sms":      10.0,
      "total_sold":   142,
      "total_revenue":710000
    }
  ]
}
```

---

## 11. Real-Time Data (WebSocket / SSE)

The dashboard's Overview tab should show live updates without full page refresh. Two approaches — use whichever fits your stack:

### Option A: WebSocket (Socket.IO recommended)

**Connection endpoint:** `wss://api.senda.co.tz/admin/v1/ws`

#### Connection Auth
Send JWT in connection query or first message:
```js
const socket = io('wss://api.senda.co.tz', {
  path: '/admin/v1/ws',
  auth: { token: 'Bearer eyJhbGci...' }
});
```

#### Events emitted by the server (subscribe to these)

| Event | Payload | Trigger |
|---|---|---|
| `sms:sent` | `{ count: 1, user_id, network, timestamp }` | Every outbound SMS |
| `sms:delivered` | `{ count: 1, user_id, network, latency_ms }` | Delivery receipt |
| `sms:failed` | `{ count: 1, user_id, network, error_code }` | Failed delivery |
| `kpi:update` | Full summary object (§4.1) | Every 60 seconds |
| `transaction:new` | Transaction object (§6.1 row) | New payment received |
| `sender_id:status_change` | `{ id, old_status, new_status, name }` | Status transition |
| `user:registered` | `{ id, email, timestamp }` | New user signup |
| `login:failed` | `{ ip, user_email, timestamp }` | Failed admin login |
| `login:suspicious` | `{ ip, attempts, timestamp }` | ≥3 fails from same IP |

#### Frontend subscription example
```js
useEffect(() => {
  socket.on('kpi:update', (data) => setStats(data));
  socket.on('sms:sent',   (d)    => setSentCount(c => c + d.count));
  return () => socket.off('kpi:update');
}, []);
```

---

### Option B: Server-Sent Events (simpler, HTTP-based)

**`GET /analytics/stream`**  
Headers: `Accept: text/event-stream`

```
event: kpi_update
data: {"total_users":1547,"sms_sent":876500,"revenue":25700000}

event: sms_activity
data: {"sent":1,"network":"Vodacom","timestamp":"2026-04-17T10:05:00Z"}
```

> SSE is simpler but unidirectional. Use WebSocket if the admin needs to push actions (e.g., approve in real time).

---

### Real-Time Polling Fallback

If neither WS nor SSE is implemented initially, the frontend can poll these lightweight endpoints every **30 seconds**:

| Endpoint | Purpose |
|---|---|
| `GET /analytics/summary?period=today` | Refresh KPI cards |
| `GET /sender-ids?status=pending&limit=1` | Badge count for nav |
| `GET /transactions?status=pending&limit=1` | Pending txn count |

---

## 12. Database Schema Reference

Minimal schema for backend engineers. Expand with indexes and constraints as needed.

```sql
-- ─── Admin Users ──────────────────────────────────────────────────────────────
CREATE TABLE admin_users (
  id          VARCHAR(16)  PRIMARY KEY,  -- ADM-00001
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(32)  NOT NULL DEFAULT 'admin',
  status      VARCHAR(16)  NOT NULL DEFAULT 'active',
  last_login  TIMESTAMPTZ,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- role: super_admin | admin | support

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          VARCHAR(16)  PRIMARY KEY,   -- USR-01001
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  phone       VARCHAR(20)  UNIQUE,
  role        VARCHAR(16)  NOT NULL DEFAULT 'user',
  status      VARCHAR(16)  NOT NULL DEFAULT 'active',
  balance     INTEGER      NOT NULL DEFAULT 0,  -- SMS credits
  sms_sent    INTEGER      NOT NULL DEFAULT 0,
  joined_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- role: user | partner | admin | super_admin
-- status: active | suspended

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id          VARCHAR(20)  PRIMARY KEY,  -- TXN-10001
  user_id     VARCHAR(16)  NOT NULL REFERENCES users(id),
  package_id  VARCHAR(10)  NOT NULL REFERENCES sms_packages(id),
  amount      INTEGER      NOT NULL,     -- TZS, no decimals
  credits     INTEGER      NOT NULL,
  method      VARCHAR(32)  NOT NULL,     -- M-Pesa | Tigo Pesa | Airtel Money | Bank Transfer
  status      VARCHAR(16)  NOT NULL DEFAULT 'pending',
  ref         VARCHAR(32)  NOT NULL,     -- internal reference
  gateway_ref VARCHAR(64),              -- payment gateway reference
  notes       TEXT,
  date        DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- status: pending | completed | failed | refunded

-- ─── Sender IDs ───────────────────────────────────────────────────────────────
CREATE TABLE sender_ids (
  id          VARCHAR(12)  PRIMARY KEY,  -- SID-1001
  name        VARCHAR(11)  NOT NULL,     -- max 11 chars (GSM standard)
  owner_id    VARCHAR(16)  NOT NULL REFERENCES users(id),
  company     VARCHAR(255) NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  type        VARCHAR(16)  NOT NULL,     -- Promotional | Transactional
  network     VARCHAR(32)  NOT NULL DEFAULT 'All Networks',
  purpose     VARCHAR(64),
  sms_count   INTEGER      NOT NULL DEFAULT 0,
  invoice_no  VARCHAR(20),
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- status: pending | await_payment | approved | rejected | require_changes

CREATE TABLE sender_id_history (
  id          SERIAL       PRIMARY KEY,
  sender_id   VARCHAR(12)  NOT NULL REFERENCES sender_ids(id),
  old_status  VARCHAR(20),
  new_status  VARCHAR(20)  NOT NULL,
  notes       TEXT,
  changed_by  VARCHAR(16)  REFERENCES admin_users(id),
  changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Partners ─────────────────────────────────────────────────────────────────
CREATE TABLE partners (
  id          VARCHAR(12)  PRIMARY KEY,  -- PTR-3001
  name        VARCHAR(255) NOT NULL,
  contact     VARCHAR(255) UNIQUE NOT NULL,
  phone       VARCHAR(20),
  region      VARCHAR(64),
  status      VARCHAR(16)  NOT NULL DEFAULT 'pending',
  tier        VARCHAR(16)  NOT NULL DEFAULT 'Silver',
  clients     INTEGER      NOT NULL DEFAULT 0,
  sms_sent    INTEGER      NOT NULL DEFAULT 0,
  revenue     BIGINT       NOT NULL DEFAULT 0,
  commission  BIGINT       NOT NULL DEFAULT 0,
  api_key_hash VARCHAR(255),           -- hashed; return plaintext only once
  join_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- status: active | pending | suspended
-- tier:   Silver | Gold | Platinum

-- ─── Login Activity ───────────────────────────────────────────────────────────
CREATE TABLE login_activity (
  id          VARCHAR(20)  PRIMARY KEY,  -- LOG-05001
  user_id     VARCHAR(16),              -- null for failed attempts with unknown user
  user_email  VARCHAR(255) NOT NULL,
  ip          INET         NOT NULL,
  device      VARCHAR(255),
  location    VARCHAR(128),
  status      VARCHAR(10)  NOT NULL,    -- success | failed
  role        VARCHAR(16),
  time        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE blocked_ips (
  ip          INET         PRIMARY KEY,
  reason      TEXT,
  blocked_by  VARCHAR(16)  REFERENCES admin_users(id),
  blocked_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

-- ─── SMS Packages ─────────────────────────────────────────────────────────────
CREATE TABLE sms_packages (
  id          VARCHAR(10)  PRIMARY KEY,  -- PKG-001
  name        VARCHAR(64)  NOT NULL,
  credits     INTEGER      NOT NULL,
  price       INTEGER      NOT NULL,     -- TZS
  per_sms     NUMERIC(5,2) NOT NULL,
  popular     BOOLEAN      NOT NULL DEFAULT false,
  color       VARCHAR(10),
  desc        TEXT,
  active      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Analytics Cache ──────────────────────────────────────────────────────────
-- Store pre-aggregated monthly snapshots so chart queries are O(1)
CREATE TABLE analytics_monthly (
  id          SERIAL       PRIMARY KEY,
  year        SMALLINT     NOT NULL,
  month       SMALLINT     NOT NULL,    -- 1–12
  sms_sent    INTEGER      NOT NULL DEFAULT 0,
  sms_delivered INTEGER    NOT NULL DEFAULT 0,
  sms_failed  INTEGER      NOT NULL DEFAULT 0,
  sms_pending INTEGER      NOT NULL DEFAULT 0,
  revenue     BIGINT       NOT NULL DEFAULT 0,
  packages_sold INTEGER    NOT NULL DEFAULT 0,
  new_users   INTEGER      NOT NULL DEFAULT 0,
  active_users INTEGER     NOT NULL DEFAULT 0,
  churned_users INTEGER    NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(year, month)
);
```

---

## 13. Security Requirements

### 13.1 Auth & Sessions
- [x] JWT signed with **RS256** (asymmetric) — not HS256
- [x] Access token TTL: **8 hours** — matches frontend `localStorage` session expiry
- [x] Refresh tokens stored **HttpOnly, Secure, SameSite=Strict** cookie
- [x] Refresh token rotation on every use (invalidate old on issue of new)
- [x] Keep a `refresh_token_blacklist` in Redis for invalidated tokens
- [x] Admin login attempts: max **5 per 15 minutes** per IP (rate limiting)
- [x] Account lockout after 5 consecutive failures (15-minute cooldown)

### 13.2 API Security
- [x] All endpoints: **HTTPS only** — reject HTTP with `301` redirect
- [x] CORS: restrict `Access-Control-Allow-Origin` to known admin domains only
- [x] Rate limiting: **100 req/min per IP** on regular endpoints; **10 req/min** on auth endpoints
- [x] Request body size limit: **1 MB** (blocks payload attacks)
- [x] SQL injection: use parameterized queries / ORM at all times — no string interpolation
- [x] Input validation: sanitize and validate all inputs with a schema validator (Joi, Zod, or class-validator)
- [x] Blocked IPs checked in Redis **before** hitting any controller logic

### 13.3 Sensitive Data
- [x] Never log or return `password`, `password_hash`, `api_key_hash` in any API response
- [x] Partner `api_key` plaintext returned **only once** (creation / regeneration) — store only the bcrypt hash
- [x] Mask sensitive fields in logs: email → `al***@gmail.com`, phone → `+255***4678`
- [x] Audit log every status change (sender IDs, partners, users, transactions) with `changed_by` and timestamp

### 13.4 Headers (set on all responses)
```
Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

---

## 14. Error Codes Reference

All errors follow the envelope:
```json
{
  "success": false,
  "error": {
    "code":    "MACHINE_READABLE_CODE",
    "message": "Human-readable description.",
    "field":   "email"
  }
}
```

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or malformed request field |
| 400 | `INVALID_STATUS_TRANSITION` | Status change not permitted |
| 401 | `INVALID_CREDENTIALS` | Wrong email/password |
| 401 | `TOKEN_EXPIRED` | JWT has expired |
| 401 | `TOKEN_INVALID` | JWT is malformed or tampered |
| 403 | `FORBIDDEN` | Valid token but insufficient role |
| 403 | `IP_BLOCKED` | Requesting IP is blocked |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `DUPLICATE` | Unique constraint violation (e.g. duplicate sender name) |
| 409 | `PACKAGE_IN_USE` | Cannot delete package with transactions |
| 422 | `UNPROCESSABLE` | Request structurally valid but logically invalid |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `SERVICE_UNAVAILABLE` | Downstream dependency down |

---

## 15. Frontend Integration Guide

This section is for the frontend developer who will replace the mock data in `senda-dashboard.jsx` with real API calls.

### 15.1 API Client Setup

Create a shared Axios/fetch client at the top of the file (or a separate `api.js`):

```js
// api.js — place alongside senda-dashboard.jsx
const BASE_URL = 'https://api.senda.co.tz/admin/v1';

function getToken() {
  try {
    const s = localStorage.getItem('senda_admin_auth');
    return s ? JSON.parse(s).token : null;
  } catch { return null; }
}

export async function adminFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
    credentials: 'include',  // for HttpOnly refresh cookie
  });

  if (res.status === 401) {
    // Try refresh
    const refreshed = await fetch(`${BASE_URL}/auth/admin/refresh`, {
      method: 'POST', credentials: 'include'
    });
    if (refreshed.ok) {
      const { data } = await refreshed.json();
      const existing = JSON.parse(localStorage.getItem('senda_admin_auth') || '{}');
      localStorage.setItem('senda_admin_auth', JSON.stringify({ ...existing, token: data.access_token }));
      return adminFetch(path, options); // retry once
    }
    localStorage.removeItem('senda_admin_auth');
    window.location.reload(); // back to login
  }

  return res.json();
}
```

---

### 15.2 Mock → Real Replacement Map

Each constant in `senda-dashboard.jsx` maps to a specific endpoint:

| Current mock constant | Replace with endpoint | Hook/location |
|---|---|---|
| `stats` | `GET /analytics/summary` | `OverviewTab` — top stat cards |
| `monthlySMS` | `GET /analytics/sms/monthly?year=2026` | `OverviewTab` — SMS Volume chart |
| `revenueData` | `GET /analytics/revenue/monthly?year=2026` | `OverviewTab` — Revenue chart |
| `userGrowth` | `GET /analytics/users/growth?year=2026` | `OverviewTab` — User Growth chart |
| `deliveryPie` | `GET /analytics/sms/delivery-status` | `OverviewTab` — Delivery Pie |
| `networkPerf` | `GET /analytics/networks/performance` | `OverviewTab` — Network bars |
| `delivRate` (computed) | `GET /analytics/sms/delivery-rate-trend` | `OverviewTab` — Trend + MA chart |
| `transactions` | `GET /transactions` | `TransactionsTab` |
| `senderIds` | `GET /sender-ids` | `SenderIdsTab` |
| `partners` | `GET /partners` | `PartnersTab` |
| `partnerRevTrend` | `GET /partners/analytics/revenue-trend` | `PartnersTab` — Revenue chart |
| `tierDist` | `GET /partners/analytics/tier-distribution` | `PartnersTab` — Pie |
| `loginActivity` | `GET /auth/activity` | `LoginActivityTab` |
| `smsPackages` | `GET /packages` | `SmsPackagesTab` |

---

### 15.3 Data Fetching Pattern

Replace mock state initialization with `useEffect`:

```js
// BEFORE (mock):
const [items, setItems] = useState(senderIds);

// AFTER (real API):
const [items, setItems]   = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError]   = useState(null);

useEffect(() => {
  setLoading(true);
  adminFetch('/sender-ids?page=1&limit=50')
    .then(res => {
      if (res.success) setItems(res.data);
      else setError(res.error?.message);
    })
    .catch(e => setError(e.message))
    .finally(() => setLoading(false));
}, []);

if (loading) return <div style={{padding:40,textAlign:'center'}}>Loading...</div>;
if (error)   return <div style={{padding:40,textAlign:'center',color:'red'}}>{error}</div>;
```

---

### 15.4 Action → Endpoint Map

| UI Action | Endpoint |
|---|---|
| Login button | `POST /auth/admin/login` |
| Logout button | `POST /auth/admin/logout` |
| Approve sender ID | `PATCH /sender-ids/:id/status` `{status:"approved"}` |
| Reject sender ID | `PATCH /sender-ids/:id/status` `{status:"rejected",notes}` |
| Require Changes | `PATCH /sender-ids/:id/status` `{status:"require_changes",notes}` |
| Mark Paid | `PATCH /sender-ids/:id/status` `{status:"approved"}` |
| Request Payment | `PATCH /sender-ids/:id/status` `{status:"await_payment",invoice_no}` |
| Approve transaction | `POST /transactions/:id/approve` |
| Refund transaction | `POST /transactions/:id/refund` `{reason}` |
| Suspend user | `PATCH /users/:id/status` `{status:"suspended",reason}` |
| Activate user | `PATCH /users/:id/status` `{status:"active"}` |
| Activate partner | `PATCH /partners/:id/status` `{status:"active"}` |
| Suspend partner | `PATCH /partners/:id/status` `{status:"suspended",reason}` |
| Delete partner | `DELETE /partners/:id` |
| Block IP | `POST /auth/activity/block-ip` `{ip,reason}` |
| Save package | `PUT /packages/:id` or `POST /packages` |
| Delete package | `DELETE /packages/:id` |

---

### 15.5 Real-Time Integration

```js
// In SendaAdmin root component or Dashboard component
import { io } from 'socket.io-client';

useEffect(() => {
  if (!isLoggedIn) return;

  const socket = io('wss://api.senda.co.tz', {
    path: '/admin/v1/ws',
    auth: { token: getToken() },
  });

  socket.on('kpi:update',           data => setStats(data));
  socket.on('transaction:new',      data => setTransactions(t => [data, ...t]));
  socket.on('sender_id:status_change', data => {
    setSenderIds(ids => ids.map(s => s.id === data.id ? { ...s, status: data.new_status } : s));
  });
  socket.on('login:suspicious', data => {
    showToast(`⚠ Suspicious login from ${data.ip} (${data.attempts} attempts)`, 'error');
  });

  return () => socket.disconnect();
}, [isLoggedIn]);
```

---

*Document generated: 2026-04-17*  
*Maintained by: SENDA Engineering Team*  
*Frontend reference: `senda-dashboard.jsx`*

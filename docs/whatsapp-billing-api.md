# Custom Credit Purchase API — SMS & WhatsApp (Unified)

## Overview

Both SMS and WhatsApp custom purchases use the **same endpoints**. The `purchase_type` field in the request body tells the backend which service to apply.

---

## Pricing Tiers

### SMS Tiers

| Tier     | Range            | Price / msg (TZS) |
| -------- | ---------------- | ----------------- |
| Lite     | 1 – 49,999       | 18.00             |
| Standard | 50,000 – 149,999 | 14.00             |
| Pro      | 250,000+         | 12.00             |

### WhatsApp Tiers

| Tier       | Range             | Price / msg (TZS) |
| ---------- | ----------------- | ----------------- |
| Standard   | 1 – 50,000        | 16.00             |
| Growth     | 50,001 – 100,000  | 14.00             |
| Enterprise | 100,001+          | 12.00             |

Minimum credits: **1,000** for SMS · **10,000** for WhatsApp

---

## Endpoint 1 — Calculate Pricing

**URL:** `POST /api/billing/payments/custom-sms/calculate/`

**Authentication:** Required (JWT)

### Request Body

```json
{
  "credits": 15000,
  "purchase_type": "whatsapp"
}
```

| Field           | Type    | Required | Notes                           |
| --------------- | ------- | -------- | ------------------------------- |
| `credits`       | integer | ✅       | Number of SMS or WhatsApp msgs  |
| `purchase_type` | string  | ✅       | `"sms"` or `"whatsapp"`         |

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "credits": 15000,
    "unit_price": 16.0,
    "total_price": 240000.0,
    "active_tier": "Standard",
    "tier_min_credits": 1,
    "tier_max_credits": 50000,
    "savings_percentage": 0.0,
    "pricing_tiers": [
      { "name": "Standard",   "min_credits": 1,      "max_credits": 50000,  "unit_price": 16.0 },
      { "name": "Growth",     "min_credits": 50001,  "max_credits": 100000, "unit_price": 14.0 },
      { "name": "Enterprise", "min_credits": 100001, "max_credits": null,   "unit_price": 12.0 }
    ]
  }
}
```

---

## Endpoint 2 — Initiate Custom Purchase

**URL:** `POST /api/billing/payments/custom-sms/initiate/`

**Authentication:** Required (JWT)

### Request Body

```json
{
  "credits": 15000,
  "purchase_type": "whatsapp",
  "buyer_email": "user@example.com",
  "buyer_name": "Florence Sway",
  "buyer_phone": "0684475390",
  "mobile_money_provider": "airtel"
}
```

| Field                   | Type    | Required | Notes                                      |
| ----------------------- | ------- | -------- | ------------------------------------------ |
| `credits`               | integer | ✅       | Min 1,000 for SMS · Min 10,000 for WA      |
| `purchase_type`         | string  | ✅       | `"sms"` or `"whatsapp"`                    |
| `buyer_email`           | string  | ✅       | Receipt destination                        |
| `buyer_name`            | string  | ✅       | Full name of purchaser                     |
| `buyer_phone`           | string  | ✅       | Mobile money number                        |
| `mobile_money_provider` | string  | ✅       | `vodacom` / `tigo` / `airtel` / `halotel`  |

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Custom WhatsApp purchase initiated successfully. Please complete payment on your mobile device.",
  "data": {
    "purchase_id": "uuid-string",
    "purchase_type": "whatsapp",
    "transaction_id": "uuid-string",
    "order_id": "CUSTOM-ABC1-2604251533",
    "total_price": 240000.0,
    "status": "pending",
    "payment_instructions": "Check your handset to confirm payment."
  }
}
```

### Error Responses

Below minimum (400):

```json
{ "success": false, "error": "Minimum 10,000 messages required for WhatsApp purchase." }
```

Invalid purchase_type (400):

```json
{ "success": false, "error": "Invalid purchase_type. Must be 'sms' or 'whatsapp'." }
```

---

## Endpoint 3 — Check Purchase Status

**URL:** `GET /api/billing/payments/custom-sms/{purchase_id}/status/`

**Authentication:** Required (JWT)

### Status Response (200 OK)

```json
{
  "success": true,
  "data": {
    "purchase_id": "uuid-string",
    "purchase_type": "whatsapp",
    "credits": 15000,
    "status": "completed",
    "completed_at": "2026-04-25T12:00:00Z",
    "message": "Payment verified. 15000 WhatsApp credits added to your balance."
  }
}
```

---

## Endpoint 4 — Billing History Summary

**URL:** `GET /api/billing/history/`

**Authentication:** Required (JWT)

### History Response (200 OK)

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_purchased": 230000.0,
      "sms": {
        "total_amount": 150000.0,
        "total_credits": 5000,
        "current_balance": 1200
      },
      "whatsapp": {
        "total_amount": 80000.0,
        "total_credits": 5000,
        "current_balance": 5000
      }
    }
  }
}
```

---

## Implementation Notes

1. **Tier resolution** — use `purchase_type` to select the correct tier table at request time.
2. **Minimum enforcement** — reject `credits < 1000` for SMS or `credits < 10000` for WhatsApp with a `400` error.
3. **Credit allocation** — on payment success, credit the correct balance: `SMSBalance` for `"sms"`, `WhatsAppMessageBalance` for `"whatsapp"`.
4. **Payment flow** — ZenoPay initiation is identical for both types; only the amount and metadata differ.
5. **No new endpoint needed** — the existing `/custom-sms/calculate/` and `/custom-sms/initiate/` now serve both services via `purchase_type`.

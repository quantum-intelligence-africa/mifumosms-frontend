# Role-Based Access Control (RBAC) Implementation

## Overview
The application supports two distinct user roles: **OWNER** (account owner) and **PARTINA** (partner). Account owners can request to become partners, and once approved by an admin, they gain access to exclusive partner features. The two roles are **NOT mutually exclusive** — an OWNER can also be a PARTINA.

## User Roles

### OWNER (Account Owner)
- Default role for all users
- Can access all standard features:
  - Dashboard
  - SMS Management (Send, Purchase, Sender Names, Purchase History)
  - Contacts
  - Campaigns
  - Integration Guide
  - Settings
  - Notifications
- Can **REQUEST** to become a PARTINA partner
- Identified by: `is_owner = true` in database

### PARTINA (Partner)
- **Approved** upgrade role (not default)
- Must be requested by user and approved by admin
- ANYONE can request to become PARTINA, including OWNERs
- Gains access to exclusive features:
  - Partner Insights (analytics and insights exclusive to partners)
  - Partner Integration Reference (partner-only API documentation)
- In addition to all OWNER features
- Identified by: `is_partina = true` in database

## Role Combinations

### Regular Owner (Most Users)
```
is_owner: true
is_partina: false
```
- Access: All standard features
- Cannot access: Partner Insights, Partner Integration Reference

### Owner + Partner (Approved)
```
is_owner: true
is_partina: true
```
- Access: All standard features + partner features
- This is the "Premium" account status

## User Flow: Requesting Partner Status

1. User logs in (Owner account)
2. User goes to **Settings** → **Partner** section
3. Reads why to become a partner
4. Submits request with reason
5. Admin reviews and approves/rejects
6. If approved: `is_partina` set to `true` in database
7. Next login: User sees partner features in navigation
8. Can now access Partner Insights and Partner Integration pages

## Implementation Details

### 1. User Data Structure
**File: `src/lib/api.ts`**
```typescript
export interface User {
  id: string | number;
  email: string;
  // ... other fields
  is_owner?: boolean;     // Account owner status
  is_partina?: boolean;   // Partner approved status
}
```

### 2. Route Protection
**File: `src/components/ProtectedRoute.tsx`**
- `<ProtectedRoute>` - Standard routes (all authenticated users)
- `<ProtectedRoute requirePartner>` - Partner-only routes
- If user lacks partner access:
  - Shows "Partner Access Required" page
  - Provides step-by-step instructions to request partner status
  - Includes direct link to Settings

**File: `src/App.tsx`**
Routes using partner protection:
```typescript
<Route path="/partner-insights" element={
  <ProtectedRoute requirePartner>
    <PertinaInsights />
  </ProtectedRoute>
} />

<Route path="/partner-integration" element={
  <ProtectedRoute requirePartner>
    <PertinaIntegration />
  </ProtectedRoute>
} />
```

### 3. Navigation Menu
**File: `src/components/layout/AppSidebar.tsx`**
- Dynamically shows/hides partner items based on `is_partina` status
- Regular owners: Partner menu items hidden
- Partners: Partner menu items visible
- All other items visible to both owner types

```typescript
// Only show partner items if user is approved partner
...(user?.is_partina ? [
  { name: t("nav.partner_insights"), href: "/partner-insights", icon: BarChart3 },
  { name: t("nav.partner_reference"), href: "/partner-integration", icon: Server },
] : [])
```

## Access Matrix

| Feature | Owner (Non-Partner) | Owner + Partner |
|---------|-------------------|-----------------|
| Dashboard | ✅ | ✅ |
| Send SMS | ✅ | ✅ |
| Purchase SMS | ✅ | ✅ |
| Sender Names | ✅ | ✅ |
| Purchase History | ✅ | ✅ |
| Contacts | ✅ | ✅ |
| Campaigns | ✅ | ✅ |
| Integration Guide | ✅ | ✅ |
| Settings | ✅ | ✅ |
| Partner Insights | ❌ | ✅ |
| Partner Integration | ❌ | ✅ |

## Features Available to Partners Only

### Partner Insights
- Exclusive analytics for partners
- Insights into partner operations
- Partner-specific metrics

### Partner Integration Reference
- API endpoints for partner integrations
- Partner-specific API documentation
- Integration guides for partners

## Development Guidelines

### Adding New Features

#### Standard Features (All Authenticated Users)
```typescript
// In App.tsx
<Route path="/new-feature" element={
  <ProtectedRoute>
    <NewFeature />
  </ProtectedRoute>
} />

// In AppSidebar.tsx - Add to main navigation array
{ name: t("nav.new_feature"), href: "/new-feature", icon: IconName }
```

#### Partner-Only Features
```typescript
// In App.tsx
<Route path="/partner/new-feature" element={
  <ProtectedRoute requirePartner>
    <PartnerNewFeature />
  </ProtectedRoute>
} />

// In AppSidebar.tsx - Add to partner items
...(user?.is_partina ? [
  { name: t("nav.partner_new_feature"), href: "/partner/new-feature", icon: IconName },
] : [])
```

### Checking User Role in Components
```typescript
import { useAuth } from "@/contexts/AuthContext";

export function MyComponent() {
  const { user } = useAuth();

  // Check if user is owner
  if (user?.is_owner) {
    // Show owner features
  }

  // Check if user is partner
  if (user?.is_partina) {
    // Show partner features
  }

  // Check if user is owner AND partner
  if (user?.is_owner && user?.is_partina) {
    // Show premium features
  }
}
```

## Admin Operations

### Approving Partner Requests
1. Admin reviews partner requests in backend admin panel
2. Admin approves request
3. Backend sets `is_partina = true` for user account
4. User sees partner features on next login

### Important Notes
- `is_owner` is typically set during account creation
- `is_partina` is set by admin after request approval
- Both are independent flags (not mutually exclusive)
- A user cannot unbecome an owner (fundamental role)
- A user can lose partner status if revoked by admin

## Backend Integration

### User Response Format
```json
{
  "id": 123,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_owner": true,
  "is_partina": false,
  ...
}
```

### Partner Request Endpoint
- `POST /auth/request-partina/`
- Body: `{ "reason": "string" }`
- Response: Success message

### User Preference Endpoint
- Returns current `is_owner` and `is_partina` flags
- Updated on every user data fetch

## Testing Checklist

- [ ] Regular owner can access all standard features
- [ ] Regular owner cannot access partner pages (shows access denied)
- [ ] Regular owner can request partner status in Settings
- [ ] Partner user can access all standard features
- [ ] Partner user can access Partner Insights
- [ ] Partner user can access Partner Integration Reference
- [ ] Partner items appear in navigation for partners only
- [ ] Direct URL access to partner pages respects role
- [ ] Settings shows correct partner request form based on status

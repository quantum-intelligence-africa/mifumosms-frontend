# OWNER & PARTINA Role System - Complete Implementation

## System Architecture

### Two Independent Role Flags

```
User Account = OWNER (Account Owner)
    ├─ is_owner: true  [SET AT REGISTRATION]
    └─ Can request PARTINA status

    └─ If Approved by Admin:
        └─ is_partina: true  [SET BY ADMIN]
        └─ Now has access to PARTNER PAGES
```

### Role Combinations

| is_owner | is_partina | User Status | Access |
|----------|-----------|-------------|--------|
| true | false | Regular Owner | All standard features |
| true | true | Owner + Partner | All features + Partner Pages |

## User Journey

### Step 1: User Registration
- User creates account (email, password, etc.)
- System sets `is_owner = true`
- System sets `is_partina = false`
- User sees all standard features in navigation
- User sees "Become a Partner" option in Settings

### Step 2: Request Partner Status
- User goes to **Settings** → **Partner** section
- Reads benefits of becoming a partner
- Submits request with reason/motivation
- Request sent to backend: `POST /auth/request-partina/`

### Step 3: Admin Approval
- Admin reviews partner request in admin panel
- Admin approves request
- System updates: `is_partina = true` for user account

### Step 4: Partner Gains Access
- User logs in
- System sees `is_partina = true`
- Partner-only menu items appear:
  - Partner Insights
  - Partner Integration Reference
- User can now access partner pages

## What Each Role Can See

### OWNER Only (is_partina = false)
```
Navigation:
├─ Dashboard
├─ SMS (expanded)
│  ├─ Send SMS
│  ├─ Purchase SMS
│  ├─ Sender Names
│  └─ Purchase History
├─ Contacts
├─ Campaigns
├─ Integration Guide
└─ Settings

Cannot Access:
├─ Partner Insights ❌
└─ Partner Integration Reference ❌
```

### OWNER + PARTNER (is_partina = true)
```
Navigation:
├─ Dashboard
├─ SMS (expanded)
│  ├─ Send SMS
│  ├─ Purchase SMS
│  ├─ Sender Names
│  └─ Purchase History
├─ Contacts
├─ Campaigns
├─ Partner Insights ✅ (NEW)
├─ Partner Integration Reference ✅ (NEW)
├─ Integration Guide
└─ Settings

Can Access: ALL
```

## Feature Implementation

### 1. User Data (src/lib/api.ts)
```typescript
export interface User {
  id: string | number;
  email: string;
  // ... other fields ...
  is_owner?: boolean;     // Account owner (default: true)
  is_partina?: boolean;   // Partner role (default: false)
}
```

### 2. Protected Routes (src/App.tsx)
```typescript
// Standard route - all authenticated users
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Partner-only route - requires is_partina=true
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

### 3. Route Access Control (src/components/ProtectedRoute.tsx)
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePartner?: boolean;  // Flag for partner-only routes
}

// If requirePartner=true and user lacks partner status:
// - Show "Partner Access Required" page
// - Provide instructions on how to request partner status
// - Link to Settings
```

### 4. Navigation Filtering (src/components/layout/AppSidebar.tsx)
```typescript
// Partner items only show if user has partner role
const navigation: NavItem[] = [
  // ... standard items shown to all users ...

  // Partner items - conditional render
  ...(user?.is_partina ? [
    { name: "Partner Insights", href: "/partner-insights", icon: BarChart3 },
    { name: "Partner Integration", href: "/partner-integration", icon: Server },
  ] : []),

  // ... more standard items ...
];
```

## Checking Roles in Components

### Check if User is Owner
```typescript
import { useAuth } from "@/contexts/AuthContext";

export function MyComponent() {
  const { user } = useAuth();

  if (user?.is_owner) {
    // Show owner features
  }
}
```

### Check if User is Partner
```typescript
if (user?.is_partina) {
  // Show partner features
}
```

### Check if User is Both
```typescript
if (user?.is_owner && user?.is_partina) {
  // Show premium/partner features
}
```

## Backend API Requirements

### User Endpoint Response
When returning user data, include both flags:
```json
{
  "id": 123,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_owner": true,
  "is_partina": false,
  "is_verified": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Partner Request Endpoint
Already implemented in code:
```
POST /auth/request-partina/
Body: { "reason": "string" }
Response: { "success": boolean, "message": "string" }
```

### Update User Endpoint
When admin approves partner request:
```
PATCH /auth/user/{id}/
Body: { "is_partina": true }
Response: Updated user object with is_partina=true
```

## User Experience on Access Denied

When a non-partner user tries to access `/partner-insights`:

1. **ProtectedRoute** intercepts request
2. **Checks**: `if (requirePartner && !user?.is_partina)`
3. **Shows**: "Partner Access Required" page with:
   - Warning icon
   - Clear message: "This feature is exclusively for Mifumo Connect Partners"
   - Step-by-step instructions:
     1. Go to Settings
     2. Find the Partner section
     3. Submit your partner request
     4. Wait for admin approval
     5. Once approved, you'll see partner features
   - Button: "Request Partner Status" (links to Settings)

## System Advantages

✅ **Flexibility**: Users can have both roles simultaneously
✅ **Security**: Partner routes protected by requirePartner flag
✅ **Clarity**: Two separate flags (not mutually exclusive)
✅ **Scalability**: Easy to add new partner features
✅ **UX**: Clear navigation based on user role
✅ **Non-destructive**: Partner status can be added/removed by admin

## Testing Checklist

- [ ] Regular owner (is_partina=false) can access standard pages
- [ ] Regular owner cannot access `/partner-insights` (redirected to access denied)
- [ ] Regular owner cannot access `/partner-integration` (redirected to access denied)
- [ ] Regular owner sees "Become a Partner" in Settings
- [ ] Regular owner doesn't see partner nav items
- [ ] Partner (is_partina=true) sees partner nav items
- [ ] Partner can access `/partner-insights`
- [ ] Partner can access `/partner-integration`
- [ ] Admin can set is_partina=true in database
- [ ] User sees partner features after is_partina update
- [ ] Partner request form in Settings works
- [ ] Both is_owner and is_partina persist across page reloads

## Terminology

- **OWNER**: Account owner (default role, created at registration)
- **PARTINA**: Partner (upgraded role, requires request + admin approval)
- **PARTNER**: Same as PARTINA (alternative term)
- **Approved**: Partner request accepted by admin
- **Pending**: Partner request waiting for admin review

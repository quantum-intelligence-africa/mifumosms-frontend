# Role and Partina Status Implementation Guide

## Overview
This document describes the complete implementation of user roles (Owner, Admin, Agent) and Partina status in the frontend application.

## Backend Data Structure

### User Model
```typescript
{
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  is_active: boolean;
  // Partina fields
  is_partina: boolean;               // True if user is approved Partina
  partina_requested_at: string | null;  // When user requested Partina status
  partina_approved_at: string | null;   // When user was approved as Partina
  // Membership/role data
  memberships: Membership[];         // Array of user's roles in tenants
}
```

### Membership Model
```typescript
{
  id: string;
  tenant: string;                    // Tenant name or ID
  tenant_id: string;                 // Tenant UUID
  role: "owner" | "admin" | "agent"; // User's role in tenant
  status: "active" | "pending" | "suspended"; // Membership status
  created_at: string;                // When membership was created
  joined_at: string;                 // When user joined
}
```

## Frontend Implementation

### 1. Type Definitions (`src/lib/api.ts`)

**User Role Type:**
```typescript
export type UserRole = 'owner' | 'admin' | 'agent';
export type MembershipStatus = 'active' | 'pending' | 'suspended';
```

**Membership Interface:**
```typescript
export interface Membership {
  id?: string;
  tenant: string;
  tenant_id?: string;
  role: UserRole;
  status: MembershipStatus;
  joined_at?: string;
  created_at?: string;
}
```

**User Interface (Updated):**
```typescript
export interface User {
  // ... existing fields ...
  is_partina?: boolean;
  partina_requested_at?: string | null;
  partina_approved_at?: string | null;
  memberships?: Membership[];
}
```

### 2. Role Utility Functions (`src/utils/roleUtils.ts`)

Complete set of helper functions for role checking:

#### Partina Status Checks
- `isPartina(user)` - Check if user is approved Partina
- `hasPartnaRequestPending(user)` - Check if Partina status pending
- `getPartinaStatus(user)` - Get detailed Partina status

#### Tenant Role Checks
- `isOwnerInAnyTenant(user)` - Owner in any active tenant
- `isAdminInAnyTenant(user)` - Admin in any active tenant
- `isAgentInAnyTenant(user)` - Agent in any active tenant
- `hasActiveMembership(user)` - Has any active membership
- `hasRoleInTenant(user, tenantId, role)` - Specific role in specific tenant
- `getRoleInTenant(user, tenantId)` - Get role in specific tenant

#### Permission Checks
- `canManageUsers(user)` - Can manage other users (admin or owner)
- `canAccessAdmin(user)` - Can access admin features

#### Information Functions
- `getActiveMemberships(user)` - Get all active memberships
- `getHighestRole(user)` - Get highest role across all tenants (owner > admin > agent)

### 3. AuthContext Enhancement (`src/contexts/AuthContext.tsx`)

AuthContext now exposes all role checking methods:

```typescript
interface AuthContextType {
  // ... existing fields ...

  // Role checking methods
  isPartina: () => boolean;
  isOwnerInAnyTenant: () => boolean;
  isAdminInAnyTenant: () => boolean;
  isAgentInAnyTenant: () => boolean;
  hasActiveMembership: () => boolean;
  canManageUsers: () => boolean;
  canAccessAdmin: () => boolean;
  getPartinaStatus: () => PartinaStatus;
  getHighestRole: () => UserRole | null;
  getRoleInTenant: (tenantId: string) => UserRole | null;
  getActiveMemberships: () => Membership[];
}
```

### 4. useRoles Hook (`src/hooks/useRoles.ts`)

Convenient hook for accessing role information:

```typescript
const { isPartina, isOwner, isAdmin, canAccessAdmin, getHighestRole } = useRoles();
```

#### Available methods:
- `useRoles()` - Get all role methods and user data
- `useRoleInTenant(tenantId)` - Get user's role in specific tenant
- `useCanAdmin()` - Check if user can access admin features
- `useCanManageTeam()` - Check if user can manage team members
- `usePartnaStatus()` - Get Partina status details
- `useHighestRole()` - Get user's highest role

## Usage Examples

### Example 1: Check if user is Partina
```typescript
import { useRoles } from '@/hooks/useRoles';

export function PartinaFeatures() {
  const { isPartina } = useRoles();

  if (!isPartina()) {
    return <div>Only available for Partina users</div>;
  }

  return <div>Partina-exclusive features</div>;
}
```

### Example 2: Check admin permissions
```typescript
import { useRoles } from '@/hooks/useRoles';

export function AdminPanel() {
  const { canAccessAdmin } = useRoles();

  if (!canAccessAdmin()) {
    return <div>Access denied</div>;
  }

  return <div>Admin controls</div>;
}
```

### Example 3: Get user's role in specific tenant
```typescript
import { useRoles } from '@/hooks/useRoles';

export function TenantPage({ tenantId }: { tenantId: string }) {
  const { getRoleInTenant } = useRoles();
  const role = getRoleInTenant(tenantId);

  return <div>Your role: {role || 'Not a member'}</div>;
}
```

### Example 4: Get user's highest role
```typescript
import { useHighestRole } from '@/hooks/useRoles';

export function UserProfile() {
  const highestRole = useHighestRole();

  return <div>Highest role: {highestRole || 'Agent'}</div>;
}
```

### Example 5: Direct utility function usage
```typescript
import { isPartina, isOwnerInAnyTenant, getHighestRole } from '@/utils/roleUtils';

const user = getCurrentUser();

if (isPartina(user)) {
  // Show Partina features
}

if (isOwnerInAnyTenant(user)) {
  // Show owner controls
}

const highestRole = getHighestRole(user); // 'owner' | 'admin' | 'agent' | null
```

## Login Implementation

The Login form uses the `username` field as specified in the backend integration guide:

```typescript
export interface LoginRequest {
  username: string; // Changed from email to username
  password: string;
}
```

The login endpoint processes account status during login and checks:
- Whether account is verified/activated
- Whether account is suspended
- Membership status in tenants
- Partina approval status

## Account Status Validation

Account status is checked during:
1. **Login** - Verifies activation status and membership
2. **Profile Load** - Validates current session status
3. **Token Refresh** - Ensures membership is still active

## Best Practices

### 1. Always check membership status, not just role
```typescript
// Good: Checks both role AND active status
const isOwner = isOwnerInAnyTenant(user);

// Avoid: Only checks role type
const hasOwnerRole = user.memberships?.some(m => m.role === 'owner');
```

### 2. Use appropriate hook/utility based on context
```typescript
// In React components: Use hooks
const { canAccessAdmin } = useRoles();

// In utilities/services: Use functions
import { canAccessAdmin } from '@/utils/roleUtils';
const allowed = canAccessAdmin(user);
```

### 3. Handle null/undefined gracefully
```typescript
const { isPartina, getHighestRole } = useRoles();

if (!isPartina()) {
  // Handle non-Partina
}

const role = getHighestRole(); // Returns null if no roles
```

### 4. Display role in UI
```typescript
import { useRoles } from '@/hooks/useRoles';

export function UserBadge() {
  const { user, getHighestRole } = useRoles();
  const role = getHighestRole();

  return <span className="badge">{user?.email} ({role || 'Agent'})</span>;
}
```

## API Response Handling

When the backend returns user data, ensure memberships array is properly handled:

```typescript
const response = await apiClient.getProfile();
if (response.data) {
  const user = response.data; // Has memberships: Membership[]
  const isOwner = isOwnerInAnyTenant(user);
}
```

## Testing Role Functions

```typescript
import { isPartina, isOwnerInAnyTenant, getHighestRole } from '@/utils/roleUtils';

// Test data
const ownerUser: User = {
  id: 1,
  email: 'owner@test.com',
  is_partina: true,
  partina_approved_at: '2026-02-05T10:00:00Z',
  memberships: [
    { tenant: 'Acme', role: 'owner', status: 'active' }
  ]
};

// Test
assert(isPartina(ownerUser) === true);
assert(isOwnerInAnyTenant(ownerUser) === true);
assert(getHighestRole(ownerUser) === 'owner');
```

## Migration Notes

- **Old field**: `is_owner` (boolean) - Use `isOwnerInAnyTenant()` instead
- **Old field**: `is_partina` (boolean) - Use `isPartina()` and `getPartinaStatus()` instead
- **New field**: `memberships[]` - Contains complete role/status information
- **Login field**: Changed from `email` to `username`

## Troubleshooting

### "canAccessAdmin() returns false unexpectedly"
Check that:
1. User has at least one membership with role 'owner' or 'admin'
2. Membership status is 'active' (not 'pending' or 'suspended')
3. User data is loaded from backend (not cached)

### "isPartina() returns false but user should be Partina"
Ensure:
1. `is_partina` flag is true
2. `partina_approved_at` is set to a valid timestamp
3. User data was refreshed from backend

### Empty memberships array
This is normal if:
- User has no assigned roles in tenants yet
- User is only an account owner, not a tenant member
- Check `isAccountOwner()` for account-level access instead


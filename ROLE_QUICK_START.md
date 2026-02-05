# Quick Start: Using Roles & Partina Status

## In React Components

### Check if user is Partina
```tsx
import { useRoles } from '@/hooks/useRoles';

export function MyComponent() {
  const { isPartina } = useRoles();

  return isPartina() ? <PartnaView /> : <StandardView />;
}
```

### Check admin permissions
```tsx
import { useRoles } from '@/hooks/useRoles';

export function AdminSettings() {
  const { canAccessAdmin } = useRoles();

  if (!canAccessAdmin()) return <Restricted />;
  return <AdminPanel />;
}
```

### Get user's role in a tenant
```tsx
import { useRoles } from '@/hooks/useRoles';

export function TenantDashboard({ tenantId }: { tenantId: string }) {
  const { getRoleInTenant } = useRoles();
  const role = getRoleInTenant(tenantId);

  return <div>Role: {role || 'No access'}</div>;
}
```

### Display user's highest role
```tsx
import { useHighestRole } from '@/hooks/useRoles';

export function UserHeader() {
  const role = useHighestRole();
  return <span>Role: {role || 'Agent'}</span>;
}
```

## In Utility Functions / Services

### Check role without React component
```ts
import { isOwnerInAnyTenant, canManageUsers } from '@/utils/roleUtils';

export function checkPermission(user: User) {
  if (isOwnerInAnyTenant(user)) {
    return true;
  }
  return canManageUsers(user);
}
```

### Get detailed Partina status
```ts
import { getPartinaStatus } from '@/utils/roleUtils';

const status = getPartinaStatus(user);
// { isPartina: boolean, isPending: boolean, status: 'approved'|'pending'|'none', ... }
```

## In AuthContext

```tsx
import { useAuth } from '@/contexts/AuthContext';

export function Profile() {
  const auth = useAuth();

  // Direct access to all role methods
  if (auth.isPartina()) {
    // Show Partina features
  }

  // Or use hook instead (recommended)
  const { isPartina } = useRoles();
}
```

## All Available Methods

### Partina Checks
- `isPartina()` - Is approved Partina
- `getPartinaStatus()` - Detailed Partina info

### Role Checks (Tenant-based)
- `isOwner()` / `isOwnerInAnyTenant()` - Owner in any tenant
- `isAdmin()` / `isAdminInAnyTenant()` - Admin in any tenant
- `isAgent()` / `isAgentInAnyTenant()` - Agent in any tenant
- `hasActiveMembership()` - Has any active membership

### Permission Checks
- `canAccessAdmin()` - Can use admin features
- `canManageUsers()` - Can manage team members
- `getRoleInTenant(tenantId)` - Role in specific tenant

### Role Information
- `getHighestRole()` - Owner > Admin > Agent
- `getActiveMemberships()` - List all active memberships
- `user` - Current user object with all data

## Login Changes

Login now uses `username` instead of `email`:

```tsx
const response = await apiClient.login({
  username: 'john.doe',  // Changed from email
  password: 'password123'
});
```

## Type Definitions

```typescript
// User roles
type UserRole = 'owner' | 'admin' | 'agent';

// Membership in a tenant
interface Membership {
  tenant: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
}

// User with roles
interface User {
  id: number;
  email: string;
  is_partina?: boolean;
  partina_approved_at?: string | null;
  memberships?: Membership[];
  // ... other fields ...
}
```

## Examples by Use Case

### Admin Panel Access
```tsx
const { canAccessAdmin } = useRoles();
if (canAccessAdmin()) {
  return <AdminPanel />;
}
```

### Team Management
```tsx
const { canManageUsers } = useRoles();
if (canManageUsers()) {
  return <TeamSettings />;
}
```

### Feature Gate
```tsx
const { isPartina } = useRoles();
if (!isPartina()) {
  return <PremiumFeatureUpsell />;
}
```

### Role Badge
```tsx
const { user, getHighestRole } = useRoles();
const role = getHighestRole();
return <Badge>{user?.email} - {role || 'Member'}</Badge>;
```

### Tenant-Specific Access
```tsx
const { getRoleInTenant } = useRoles();
const role = getRoleInTenant('tenant-123');
if (role === 'owner' || role === 'admin') {
  return <TenantSettings />;
}
```

## Testing

```typescript
import { isPartina, getHighestRole } from '@/utils/roleUtils';

const testUser: User = {
  id: 1,
  email: 'test@example.com',
  is_partina: true,
  partina_approved_at: '2026-02-05T10:00:00Z',
  memberships: [
    { tenant: 'acme', role: 'owner', status: 'active' }
  ]
};

console.assert(isPartina(testUser) === true);
console.assert(getHighestRole(testUser) === 'owner');
```


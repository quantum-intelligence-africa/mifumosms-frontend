/**
 * useRoles Hook
 * Provides convenient access to role checking functions from AuthContext
 */

import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/api';

export const useRoles = () => {
	const auth = useAuth();

	return {
		// User data
		user: auth.user,

		// Partina status checks
		isPartina: auth.isPartina,
		getPartinaStatus: auth.getPartinaStatus,

		// Tenant role checks
		isOwner: auth.isOwnerInAnyTenant,
		isAdmin: auth.isAdminInAnyTenant,
		isAgent: auth.isAgentInAnyTenant,
		hasActiveMembership: auth.hasActiveMembership,

		// Permission checks
		canManageUsers: auth.canManageUsers,
		canAccessAdmin: auth.canAccessAdmin,

		// Role information
		getHighestRole: auth.getHighestRole,
		getRoleInTenant: auth.getRoleInTenant,
		getActiveMemberships: auth.getActiveMemberships,
	};
};

/**
 * Hook to check specific role in specific tenant
 */
export const useRoleInTenant = (tenantId?: string) => {
	const auth = useAuth();

	if (!tenantId) {
		return null;
	}

	return auth.getRoleInTenant(tenantId);
};

/**
 * Hook to check if user can perform admin actions
 */
export const useCanAdmin = () => {
	const auth = useAuth();
	return auth.canAccessAdmin();
};

/**
 * Hook to check if user can manage team members
 */
export const useCanManageTeam = () => {
	const auth = useAuth();
	return auth.canManageUsers();
};

/**
 * Hook to check Partina status
 */
export const usePartnaStatus = () => {
	const auth = useAuth();
	return auth.getPartinaStatus();
};

/**
 * Hook to get user's highest role
 */
export const useHighestRole = (): UserRole | null => {
	const auth = useAuth();
	return auth.getHighestRole();
};

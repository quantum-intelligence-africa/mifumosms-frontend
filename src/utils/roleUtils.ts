/**
 * Role and Partina Status Utility Functions
 * Provides helper functions to check user roles and Partina status
 */

import { User, Membership, UserRole, MembershipStatus } from '@/lib/api';

/**
 * Check if user is a Partina (approved partner/agent)
 * @param user - The user object
 * @returns True if user is an approved Partina
 */
export const isPartina = (user: User | null | undefined): boolean => {
	if (!user) return false;
	return user.is_partina === true && user.partina_approved_at !== null && user.partina_approved_at !== undefined;
};

/**
 * Check if user has requested Partina status
 * @param user - The user object
 * @returns True if user has requested Partina status
 */
export const hasPartnaRequestPending = (user: User | null | undefined): boolean => {
	if (!user) return false;
	return user.is_partina === false && user.partina_requested_at !== null && user.partina_requested_at !== undefined;
};

/**
 * Check if user is an account owner
 * @param user - The user object
 * @returns True if user is an account owner
 */
export const isAccountOwner = (user: User | null | undefined): boolean => {
	if (!user) return false;
	return user.is_owner === true;
};

/**
 * Check if user is an owner in any tenant
 * @param user - The user object
 * @returns True if user has owner role in at least one active membership
 */
export const isOwnerInAnyTenant = (user: User | null | undefined): boolean => {
	if (!user || !user.memberships || user.memberships.length === 0) {
		return false;
	}
	return user.memberships.some(
		(m: Membership) => m.role === 'owner' && m.status === 'active'
	);
};

/**
 * Check if user is an admin in any tenant
 * @param user - The user object
 * @returns True if user has admin role in at least one active membership
 */
export const isAdminInAnyTenant = (user: User | null | undefined): boolean => {
	if (!user || !user.memberships || user.memberships.length === 0) {
		return false;
	}
	return user.memberships.some(
		(m: Membership) => m.role === 'admin' && m.status === 'active'
	);
};

/**
 * Check if user is an agent in any tenant
 * @param user - The user object
 * @returns True if user has agent role in at least one active membership
 */
export const isAgentInAnyTenant = (user: User | null | undefined): boolean => {
	if (!user || !user.memberships || user.memberships.length === 0) {
		return false;
	}
	return user.memberships.some(
		(m: Membership) => m.role === 'agent' && m.status === 'active'
	);
};

/**
 * Check if user has a specific role in a specific tenant
 * @param user - The user object
 * @param tenantId - The tenant ID or name
 * @param role - The role to check
 * @returns True if user has the specified role in the tenant
 */
export const hasRoleInTenant = (
	user: User | null | undefined,
	tenantId: string,
	role: UserRole
): boolean => {
	if (!user || !user.memberships || user.memberships.length === 0) {
		return false;
	}
	return user.memberships.some(
		(m: Membership) =>
			(m.tenant === tenantId || m.tenant_id === tenantId) &&
			m.role === role &&
			m.status === 'active'
	);
};

/**
 * Check if user has any active membership
 * @param user - The user object
 * @returns True if user has at least one active membership
 */
export const hasActiveMembership = (user: User | null | undefined): boolean => {
	if (!user || !user.memberships || user.memberships.length === 0) {
		return false;
	}
	return user.memberships.some((m: Membership) => m.status === 'active');
};

/**
 * Get all active memberships for a user
 * @param user - The user object
 * @returns Array of active memberships
 */
export const getActiveMemberships = (user: User | null | undefined): Membership[] => {
	if (!user || !user.memberships) {
		return [];
	}
	return user.memberships.filter((m: Membership) => m.status === 'active');
};

/**
 * Get user's role in a specific tenant
 * @param user - The user object
 * @param tenantId - The tenant ID or name
 * @returns The user's role in the tenant, or null if not a member
 */
export const getRoleInTenant = (
	user: User | null | undefined,
	tenantId: string
): UserRole | null => {
	if (!user || !user.memberships) {
		return null;
	}
	const membership = user.memberships.find(
		(m: Membership) =>
			(m.tenant === tenantId || m.tenant_id === tenantId) &&
			m.status === 'active'
	);
	return membership?.role || null;
};

/**
 * Check if user can manage other users (admin or owner)
 * @param user - The user object
 * @returns True if user can manage other users
 */
export const canManageUsers = (user: User | null | undefined): boolean => {
	if (!user || !user.memberships || user.memberships.length === 0) {
		return false;
	}
	return user.memberships.some(
		(m: Membership) =>
			(m.role === 'admin' || m.role === 'owner') &&
			m.status === 'active'
	);
};

/**
 * Check if user can access admin features
 * @param user - The user object
 * @returns True if user can access admin features
 */
export const canAccessAdmin = (user: User | null | undefined): boolean => {
	return isPartina(user) || isOwnerInAnyTenant(user) || isAdminInAnyTenant(user);
};

/**
 * Get Partina status info
 * @param user - The user object
 * @returns Object with Partina status details
 */
export const getPartinaStatus = (user: User | null | undefined): {
	isPartina: boolean;
	isPending: boolean;
	approvedAt: string | null;
	requestedAt: string | null;
	status: 'approved' | 'pending' | 'none';
} => {
	if (!user) {
		return {
			isPartina: false,
			isPending: false,
			approvedAt: null,
			requestedAt: null,
			status: 'none'
		};
	}

	return {
		isPartina: isPartina(user),
		isPending: hasPartnaRequestPending(user),
		approvedAt: user.partina_approved_at || null,
		requestedAt: user.partina_requested_at || null,
		status: isPartina(user) ? 'approved' : hasPartnaRequestPending(user) ? 'pending' : 'none'
	};
};

/**
 * Get user's highest role across all tenants
 * Priority: owner > admin > agent
 * @param user - The user object
 * @returns The highest role, or null if no active memberships
 */
export const getHighestRole = (user: User | null | undefined): UserRole | null => {
	if (!user || !user.memberships || user.memberships.length === 0) {
		return null;
	}

	const activeMemberships = user.memberships.filter((m: Membership) => m.status === 'active');
	if (activeMemberships.length === 0) {
		return null;
	}

	const roles: UserRole[] = ['owner', 'admin', 'agent'];
	for (const role of roles) {
		if (activeMemberships.some((m: Membership) => m.role === role)) {
			return role;
		}
	}

	return null;
};

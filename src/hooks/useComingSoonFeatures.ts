/**
 * useComingSoonFeatures Hook
 * React-query-backed access to the platform-wide "Coming Soon" feature flags
 * (GET /billing/coming-soon/) — same for every user regardless of tenant or
 * plan, admin-toggled from the SENDA dashboard's Coming Soon tab.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const useComingSoonFeatures = () => {
	const { isAuthenticated } = useAuth();

	const { data, isLoading } = useQuery({
		queryKey: ['billing', 'coming-soon'],
		queryFn: async () => {
			const response = await apiClient.getComingSoonFeatures();
			return response.success && response.data ? response.data : {};
		},
		enabled: isAuthenticated,
		staleTime: 5 * 60 * 1000,
	});

	const comingSoon: Record<string, boolean> = data || {};

	const isComingSoon = (key: string) => !!comingSoon[key];

	return {
		comingSoon,
		isLoading,
		isComingSoon,
	};
};

/**
 * useFeatures Hook
 * React-query-backed access to the caller's active-tenant feature-access map
 * (GET /billing/features/), cached since it's read on every page.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export const useFeatures = () => {
	const { isAuthenticated } = useAuth();

	const { data, isLoading } = useQuery({
		queryKey: ['billing', 'features'],
		queryFn: async () => {
			const response = await apiClient.getFeatureAccess();
			return response.success && response.data ? response.data : {};
		},
		enabled: isAuthenticated,
		staleTime: 5 * 60 * 1000,
	});

	const features: Record<string, boolean> = data || {};

	const hasFeature = (key: string) => !!features[key];

	return {
		features,
		isLoading,
		hasFeature,
	};
};

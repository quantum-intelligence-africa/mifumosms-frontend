import { useState, useEffect, useContext, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from '@/contexts/AuthContext';

export interface ContactSegmentCounts {
	allContacts: number;
	vipContacts: number;
	activeContacts: number;
}

export const useContactSegments = () => {
	const [segmentCounts, setSegmentCounts] = useState<ContactSegmentCounts>({
		allContacts: 0,
		vipContacts: 0,
		activeContacts: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();

	// Safe access to auth context
	const authContext = useContext(AuthContext);
	const isAuthenticated = authContext?.isAuthenticated || false;

	const fetchSegmentCounts = useCallback(async () => {
		console.log('=== FETCHING CONTACT SEGMENT COUNTS ===');
		console.log('isAuthenticated:', isAuthenticated);

		if (!isAuthenticated) {
			console.log('User not authenticated, skipping segment counts fetch');
			setIsLoading(false);
			setSegmentCounts({
				allContacts: 0,
				vipContacts: 0,
				activeContacts: 0,
			});
			return;
		}

		try {
			console.log('Fetching contact segment counts...');
			setIsLoading(true);
			setError(null);

			// Fetch all contacts count
			const allContactsResponse = await apiClient.getContacts();
			const allContactsCount = allContactsResponse.success && allContactsResponse.data
				? allContactsResponse.data.count || 0
				: 0;

			// Fetch VIP contacts count (contacts with 'vip' tag)
			const vipContactsResponse = await apiClient.getContacts({
				tags: ['vip']
			});
			const vipContactsCount = vipContactsResponse.success && vipContactsResponse.data
				? vipContactsResponse.data.count || 0
				: 0;

			// Fetch active contacts count (is_active: true)
			const activeContactsResponse = await apiClient.getContacts({
				is_active: true
			});
			const activeContactsCount = activeContactsResponse.success && activeContactsResponse.data
				? activeContactsResponse.data.count || 0
				: 0;

			const newCounts = {
				allContacts: allContactsCount,
				vipContacts: vipContactsCount,
				activeContacts: activeContactsCount,
			};

			console.log('Contact segment counts fetched:', newCounts);
			setSegmentCounts(newCounts);

		} catch (error) {
			console.error('Error fetching contact segment counts:', error);
			setError('Failed to fetch contact segment counts');

			// Set default counts on error
			setSegmentCounts({
				allContacts: 0,
				vipContacts: 0,
				activeContacts: 0,
			});

			toast({
				title: "Failed to load contact counts",
				description: "Unable to fetch real-time contact segment data",
				variant: "destructive"
			});
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, toast]);

	// Fetch segment counts on mount and when authentication changes
	useEffect(() => {
		fetchSegmentCounts();
	}, [fetchSegmentCounts]);

	const refreshSegmentCounts = useCallback(async () => {
		console.log('Manual refresh triggered for contact segment counts...');
		await fetchSegmentCounts();
	}, [fetchSegmentCounts]);

	return {
		segmentCounts,
		isLoading,
		error,
		refreshSegmentCounts,
	};
};

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
	const [isLoading, setIsLoading] = useState(false); // Start as false to allow immediate render
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();

	// Safe access to auth context
	const authContext = useContext(AuthContext);
	const isAuthenticated = authContext?.isAuthenticated || false;

	const fetchSegmentCounts = useCallback(async () => {
		if (!isAuthenticated) {
			setIsLoading(false);
			setSegmentCounts({
				allContacts: 0,
				vipContacts: 0,
				activeContacts: 0,
			});
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			// Fetch all contacts to calculate segment counts
			const allContactsResponse = await apiClient.getContacts();

			if (!allContactsResponse.success || !allContactsResponse.data) {
				throw new Error('Failed to fetch contacts');
			}

			const allContacts = allContactsResponse.data.results || [];
			const allContactsCount = allContactsResponse.data.count || allContacts.length;

			// Calculate VIP contacts count by filtering on frontend
			// (Backend may not support tags filtering yet)
			const vipContactsCount = allContacts.filter(contact =>
				contact.tags && contact.tags.includes('vip')
			).length;

			// Calculate active contacts count by filtering on frontend
			const activeContactsCount = allContacts.filter(contact =>
				contact.is_active === true
			).length;

			const newCounts = {
				allContacts: allContactsCount,
				vipContacts: vipContactsCount,
				activeContacts: activeContactsCount,
			};

			setSegmentCounts(newCounts);

		} catch (error) {
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

	useEffect(() => {
		fetchSegmentCounts();
	}, [fetchSegmentCounts]);

	const refreshSegmentCounts = useCallback(async () => {
		await fetchSegmentCounts();
	}, [fetchSegmentCounts]);

	return {
		segmentCounts,
		isLoading,
		error,
		refreshSegmentCounts,
	};
};

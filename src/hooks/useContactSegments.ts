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

			// If no VIP contacts found, log a warning for debugging
			if (vipContactsCount === 0) {
				console.warn('No VIP contacts found. Make sure some contacts have "vip" tag assigned.');
				console.log('Available tags in contacts:', [...new Set(allContacts.flatMap(c => c.tags || []))]);
			}

			// Calculate active contacts count by filtering on frontend
			const activeContactsCount = allContacts.filter(contact =>
				contact.is_active === true
			).length;

			const newCounts = {
				allContacts: allContactsCount,
				vipContacts: vipContactsCount,
				activeContacts: activeContactsCount,
			};

			console.log('Contact segment counts calculated:', newCounts);

			// Debug: Log all contacts and their tags
			console.log('All contacts:', allContacts.length);
			console.log('Sample contacts with tags:', allContacts.slice(0, 3).map(c => ({
				name: c.name,
				tags: c.tags,
				hasVipTag: c.tags && c.tags.includes('vip')
			})));

			const vipContacts = allContacts.filter(contact =>
				contact.tags && contact.tags.includes('vip')
			);
			console.log('VIP contacts found:', vipContacts.length);
			console.log('VIP contacts details:', vipContacts.map(c => ({
				name: c.name,
				tags: c.tags
			})));

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

import { useState, useEffect, useRef, useContext } from 'react';
import { SenderNameRequest, CreateSenderNameRequest, UpdateSenderNameRequest, SenderNameStats, apiClient } from '@/lib/api';
import { AuthContext } from '@/contexts/AuthContext';

// Helper function to calculate stats from sender names list
const calculateStatsFromSenderNames = (senderNames: SenderNameRequest[]): SenderNameStats => {
	const safeSenderNames = Array.isArray(senderNames) ? senderNames : [];

	return {
		total_requests: safeSenderNames.length,
		pending_requests: safeSenderNames.filter(s => s.status === 'pending').length,
		approved_requests: safeSenderNames.filter(s => s.status === 'approved').length,
		rejected_requests: safeSenderNames.filter(s => s.status === 'rejected').length,
		requires_changes_requests: safeSenderNames.filter(s => s.status === 'requires_changes').length,
		my_requests: safeSenderNames.length,
		my_pending_requests: safeSenderNames.filter(s => s.status === 'pending').length,
	};
};

export function useSenderNames() {
	const [senderNames, setSenderNames] = useState<SenderNameRequest[]>([]);
	const [stats, setStats] = useState<SenderNameStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestsCompleted = useRef(false);
	// Safe access to auth context
	const authContext = useContext(AuthContext);
	const isAuthenticated = authContext?.isAuthenticated || false;

	// Ensure senderNames is always an array
	const safeSenderNames = Array.isArray(senderNames) ? senderNames : [];

	const fetchSenderNames = async (useUnified: boolean = false, tenantId?: string) => {
		if (!isAuthenticated) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			let response;
			if (useUnified) {
				// Use the new unified endpoint
				response = await apiClient.getUnifiedSenderNames(tenantId);
			} else {
				// Use the legacy endpoint
				response = await apiClient.getUserRequests();
			}

			if (response.success && response.data) {
				let results = [];
				if (useUnified) {
					// Handle unified response structure
					if ((response.data as any).data && Array.isArray((response.data as any).data)) {
						results = (response.data as any).data;
					}
				} else {
					// Handle legacy response structures
					if (Array.isArray(response.data)) {
						// If data is directly an array
						results = response.data;
					} else if ((response.data as any).results && Array.isArray((response.data as any).results)) {
						// If data has a results property
						results = (response.data as any).results;
					} else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
						// If data has a nested data property
						results = (response.data as any).data;
					}
				}

				// Additional validation: Ensure we only show current user's requests
				// Filter out any requests that might belong to other users
				const currentUserId = authContext?.user?.id;

				if (currentUserId) {
					results = results.filter((request: any) => {
						// Check if the request belongs to the current user
						// Use the correct field extraction: user_id || user
						const requestUserId = request.user_id || request.user;
						return requestUserId === currentUserId;
					});
				}

				setSenderNames(results);

				// Calculate stats from the fetched sender names as a fallback
				const calculatedStats = calculateStatsFromSenderNames(results);
				setStats(calculatedStats);
			} else {
				console.error('Failed to fetch sender names:', response.error, 'Status:', response.status);
				if (response.status === 403) {
					setError('You do not have permission to access sender names. Please contact your administrator.');
				} else if (response.status === 401) {
					setError('Session expired. Please log in again.');
				} else {
					setError(response.error || 'Failed to fetch sender names');
				}
				setSenderNames([]); // Ensure it's always an array
			}
		} catch (err) {
			console.error('Error fetching sender names:', err);
			setError(err instanceof Error ? err.message : 'An error occurred');
			setSenderNames([]); // Ensure it's always an array
		} finally {
			setLoading(false);
			requestsCompleted.current = true;
		}
	};

	const fetchStats = async () => {
		if (!isAuthenticated) {
			return;
		}

		try {
			const response = await apiClient.getStatistics();

			if (response.success && response.data) {
				// The stats should already be user-specific from the API
				// but let's add some validation to ensure data integrity
				const statsData = response.data;
				setStats(statsData);
			} else {
				// If stats API fails, calculate stats from the sender names list
				const calculatedStats = calculateStatsFromSenderNames(senderNames);
				setStats(calculatedStats);
			}
		} catch (err) {
			// If stats API fails, calculate stats from the sender names list
			const calculatedStats = calculateStatsFromSenderNames(senderNames);
			setStats(calculatedStats);
		}
	};

	const createSenderName = async (data: CreateSenderNameRequest) => {
		try {
			setError(null);

			// Use JSON API for better error handling and required fields
			const response = await apiClient.submitSenderRequestJSON({
				requested_sender_id: data.sender_name,
				sample_content: data.use_case
			});

			if (response.success && response.data) {
				// Add the new request to the list immediately for better UX
				setSenderNames(prev => {
					const currentList = Array.isArray(prev) ? prev : [];
					return [response.data!, ...currentList];
				});

				// Refresh data from server to ensure consistency
				await fetchSenderNames();
				await fetchStats();

				return { success: true, data: response.data };
			} else {
				return {
					success: false,
					error: response.error || 'Failed to create sender name request',
					errors: response.errors
				};
			}
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : 'An error occurred'
			};
		}
	};

	const updateSenderName = async (requestId: string, data: UpdateSenderNameRequest) => {
		try {
			setError(null);
			const updateData: { status?: string; admin_notes?: string } = {};
			if (data.status) updateData.status = data.status;
			if (data.admin_notes) updateData.admin_notes = data.admin_notes;

			const response = await apiClient.updateRequest(requestId, updateData);

			if (response.success && response.data) {
				// Update the request in the list immediately for better UX
				setSenderNames(prev => {
					const currentList = Array.isArray(prev) ? prev : [];
					return currentList.map(req => req.id === requestId ? response.data! : req);
				});

				// Refresh data from server to ensure consistency
				await fetchSenderNames();
				await fetchStats();

				return { success: true, data: response.data };
			} else {
				return {
					success: false,
					error: response.error || 'Failed to update sender name request',
					errors: response.errors
				};
			}
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : 'An error occurred'
			};
		}
	};

	const deleteSenderName = async (requestId: string) => {
		try {
			setError(null);
			const response = await apiClient.deleteRequest(requestId);

			if (response.success) {
				// Remove the request from the list immediately for better UX
				setSenderNames(prev => {
					const currentList = Array.isArray(prev) ? prev : [];
					return currentList.filter(req => req.id !== requestId);
				});

				// Refresh data from server to ensure consistency
				await fetchSenderNames();
				await fetchStats();

				return { success: true };
			} else {
				return {
					success: false,
					error: response.error || 'Failed to delete sender name request'
				};
			}
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : 'An error occurred'
			};
		}
	};

	const getSenderName = async (requestId: string) => {
		try {
			setError(null);
			const response = await apiClient.getRequestDetails(requestId);

			if (response.success && response.data) {
				return { success: true, data: response.data };
			} else {
				return {
					success: false,
					error: response.error || 'Failed to fetch sender name request'
				};
			}
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : 'An error occurred'
			};
		}
	};

	useEffect(() => {
		requestsCompleted.current = false;

		// Fetch both sender names and stats using unified endpoint
		const fetchData = async () => {
			await fetchSenderNames(true); // Use unified endpoint
			await fetchStats();
		};

		fetchData();

		// Add a timeout to prevent infinite loading
		const timeout = setTimeout(() => {
			if (!requestsCompleted.current) {
				setLoading(false);
				setError('Request timeout - please check your connection');
				setSenderNames([]); // Ensure it's always an array
			}
		}, 10000); // 10 second timeout

		return () => clearTimeout(timeout);
	}, []);

	// Recalculate stats whenever senderNames changes
	useEffect(() => {
		if (senderNames.length > 0) {
			const calculatedStats = calculateStatsFromSenderNames(senderNames);
			setStats(calculatedStats);
		}
	}, [senderNames]);

	const refreshData = async () => {
		await fetchSenderNames(true); // Use unified endpoint
		await fetchStats();
	};

	const fetchSenderNamesByTenant = async (tenantId: string) => {
		await fetchSenderNames(true, tenantId);
	};

	return {
		senderNames: safeSenderNames,
		stats,
		loading,
		error,
		fetchSenderNames,
		fetchSenderNamesByTenant,
		fetchStats,
		createSenderName,
		updateSenderName,
		deleteSenderName,
		getSenderName,
		refreshData
	};
}

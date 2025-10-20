import { useState, useEffect, useRef, useContext } from 'react';
import { SenderNameRequest, CreateSenderNameRequest, UpdateSenderNameRequest, SenderNameStats, apiClient } from '@/lib/api';
import { AuthContext } from '@/contexts/AuthContext';

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

	const fetchSenderNames = async () => {
		if (!isAuthenticated) {
			console.log('User not authenticated, skipping API call');
			setLoading(false);
			return;
		}

		try {
			console.log('Fetching sender names...');
			setLoading(true);
			setError(null);

			const response = await apiClient.getUserRequests();
			console.log('=== SENDER NAMES API RESPONSE ===');
			console.log('Full response object:', response);
			console.log('Response success:', response.success);
			console.log('Response data:', response.data);
			console.log('Response error:', response.error);
			console.log('Response status:', response.status);
			console.log('Response data type:', typeof response.data);
			console.log('Response data keys:', response.data ? Object.keys(response.data) : 'No data');

			if (response.success && response.data) {
				console.log('Full response data:', response.data);
				console.log('Response data type:', typeof response.data);
				console.log('Response data keys:', Object.keys(response.data || {}));

				// Handle different possible response structures
				let results = [];
				if (Array.isArray(response.data)) {
					// If data is directly an array
					results = response.data;
					console.log('Data is direct array, results:', results);
				} else if (response.data.results && Array.isArray(response.data.results)) {
					// If data has a results property
					results = response.data.results;
					console.log('Data has results property, results:', results);
				} else if (response.data.data && Array.isArray(response.data.data)) {
					// If data has a nested data property
					results = response.data.data;
					console.log('Data has nested data property, results:', results);
				} else {
					console.log('No valid data structure found, response.data:', response.data);
				}

				// Additional validation: Ensure we only show current user's requests
				// Filter out any requests that might belong to other users
				const currentUserId = authContext?.user?.id;
				
				// TEMPORARY: If the API already returns only current user's requests, 
				// you can uncomment the lines below to test without filtering
				// console.log('Skipping user filtering - using all results from API');
				// console.log('Total results from API:', results.length);
				// setSenderNames(results);
				// return;
				
				if (currentUserId) {
					results = results.filter((request: any) => {
						// Check if the request belongs to the current user
						// Use the correct field extraction: user_id || user
						const requestUserId = request.user_id || request.user;
						
						// Debug logging to see exactly what's happening
						console.log('=== DEBUGGING USER ID FILTERING ===');
						console.log('Request object:', request);
						console.log('Request.user:', request.user);
						console.log('Request.user_id:', request.user_id);
						console.log('Current user ID:', currentUserId);
						console.log('Extracted requestUserId:', requestUserId);
						console.log('Comparison result:', requestUserId === currentUserId);
						console.log('=====================================');
						
						const isCurrentUser = requestUserId === currentUserId;
						
						if (!isCurrentUser) {
							console.log(`Filtering out request from other user: ${request.requested_sender_id || request.sender_name}, User ID: ${requestUserId}, Current User ID: ${currentUserId}`);
						} else {
							console.log(`✅ Keeping request from current user: ${request.requested_sender_id || request.sender_name}`);
						}
						
						return isCurrentUser;
					});
					console.log('Filtered results for current user:', results.length, 'requests');
				} else {
					console.log('No current user ID available, showing all results');
				}

				console.log('Final results array:', results);
				console.log('Results length:', results.length);
				setSenderNames(results);
				console.log('Sender names set:', results);
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
			console.log('User not authenticated, skipping stats fetch');
			return;
		}

		try {
			console.log('Fetching sender name statistics for current user...');
			const response = await apiClient.getStatistics();

			if (response.success && response.data) {
				console.log('Stats response:', response.data);
				// The stats should already be user-specific from the API
				// but let's add some validation to ensure data integrity
				const statsData = response.data;
				console.log('Setting stats for current user:', statsData);
				setStats(statsData);
			} else {
				console.error('Failed to fetch stats:', response.error);
			}
		} catch (err) {
			console.error('Failed to fetch sender name stats:', err);
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
				console.log('Refreshing data after successful creation...');
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
				console.log('Refreshing data after successful update...');
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
				console.log('Refreshing data after successful deletion...');
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
		fetchSenderNames();
		fetchStats();

		// Add a timeout to prevent infinite loading
		const timeout = setTimeout(() => {
			if (!requestsCompleted.current) {
				console.log('Loading timeout reached, setting loading to false');
				setLoading(false);
				setError('Request timeout - please check your connection');
				setSenderNames([]); // Ensure it's always an array
			}
		}, 10000); // 10 second timeout

		return () => clearTimeout(timeout);
	}, []);

	const refreshData = async () => {
		console.log('Manual refresh triggered...');
		await fetchSenderNames();
		await fetchStats();
	};

	return {
		senderNames: safeSenderNames,
		stats,
		loading,
		error,
		fetchSenderNames,
		fetchStats,
		createSenderName,
		updateSenderName,
		deleteSenderName,
		getSenderName,
		refreshData
	};
}

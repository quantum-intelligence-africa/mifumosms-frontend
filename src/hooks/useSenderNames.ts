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
	const [loading, setLoading] = useState(false); // Start as false to allow immediate render
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

			const response = useUnified
				? await apiClient.getUnifiedSenderNames(tenantId)
				: await apiClient.getUserRequests();

			if (response.success && response.data) {
				let results: SenderNameRequest[] = [];
				if (useUnified) {
					// Handle unified response structure
					const responseData = response.data as Record<string, unknown>;
					// The API returns { success, count, data: [...] }
					// After handleResponse, response.data contains the entire response object
					// So we need to check responseData.data for the array
					if (responseData.data && Array.isArray(responseData.data)) {
						results = responseData.data as SenderNameRequest[];
					} else if (Array.isArray(responseData)) {
						// If responseData itself is an array
						results = responseData as SenderNameRequest[];
					}
				} else {
					// Handle legacy response structures
					const responseData = response.data as Record<string, unknown> | SenderNameRequest[];
					if (Array.isArray(responseData)) {
						// If data is directly an array
						results = responseData;
					} else if (typeof responseData === 'object' && responseData !== null) {
						const dataObj = responseData as Record<string, unknown>;
						if (dataObj.results && Array.isArray(dataObj.results)) {
							// If data has a results property
							results = dataObj.results as SenderNameRequest[];
						} else if (dataObj.data && Array.isArray(dataObj.data)) {
							// If data has a nested data property
							results = dataObj.data as SenderNameRequest[];
						}
					}

					// Additional validation: Ensure we only show current user's requests (legacy only)
					// Filter out any requests that might belong to other users
					// Use setTimeout to defer heavy filtering to avoid blocking
					const currentUserId = authContext?.user?.id;

					if (currentUserId && typeof currentUserId === 'number') {
						// Break up the filtering work to avoid main thread blocking
						await new Promise(resolve => {
							setTimeout(() => {
								results = results.filter((request: SenderNameRequest) => {
									// Check if the request belongs to the current user using created_by field
									return request.created_by === currentUserId;
								});
								resolve(null);
							}, 0);
						});
					}
				}

				// Update state - break into smaller pieces for better performance
				setSenderNames(results);

				// Calculate stats asynchronously to avoid blocking
				await new Promise(resolve => {
					setTimeout(() => {
						const calculatedStats = calculateStatsFromSenderNames(results);
						setStats(calculatedStats);
						resolve(null);
					}, 0);
				});
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

				// Defer stats update to avoid blocking main thread
				await new Promise(resolve => {
					setTimeout(() => {
						setStats(statsData);
						resolve(null);
					}, 0);
				});
			} else {
				// If stats API fails, calculate stats from the sender names list
				await new Promise(resolve => {
					setTimeout(() => {
						const calculatedStats = calculateStatsFromSenderNames(senderNames);
						setStats(calculatedStats);
						resolve(null);
					}, 0);
				});
			}
		} catch (err) {
			// If stats API fails, calculate stats from the sender names list
			await new Promise(resolve => {
				setTimeout(() => {
					const calculatedStats = calculateStatsFromSenderNames(senderNames);
					setStats(calculatedStats);
					resolve(null);
				}, 0);
			});
		}
	};

	const createSenderName = async (data: CreateSenderNameRequest) => {
		try {
			setError(null);

			// Use JSON API for better error handling and required fields
			const response = await apiClient.submitSenderRequestJSON({
				requested_sender_id: data.requested_sender_id || data.sender_name,
				request_type: data.request_type || 'custom',
				sample_content: data.sample_content || data.use_case,
				sender_name_purpose: data.sender_name_purpose || data.use_case,
				kyc_documents: data.supporting_documents
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

			// If requestId looks like a sender_id (not a UUID), fetch the actual request ID
			let actualRequestId = requestId;
			if (!requestId.includes('-') || requestId.length < 20) {
				// Try to find the actual request ID from user requests
				const requestsResponse = await apiClient.getUserRequests();
				if (requestsResponse.success && requestsResponse.data?.results) {
					const foundRequest = (requestsResponse.data.results as SenderNameRequest[]).find((req: SenderNameRequest) =>
						req.sender_name === requestId
					);
					if (foundRequest && foundRequest.id) {
						actualRequestId = foundRequest.id;
					}
				}
			}

			const response = await apiClient.deleteRequest(actualRequestId);

			if (response.success) {
				// Remove the request from the list immediately for better UX
				setSenderNames(prev => {
					const currentList = Array.isArray(prev) ? prev : [];
					return currentList.filter(req => req.id !== actualRequestId && req.sender_name !== requestId);
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

		// Add a timeout to prevent infinite loading (must be longer than API timeout)
		const timeout = setTimeout(() => {
			if (!requestsCompleted.current) {
				console.warn('Sender names fetch timeout - request did not complete in time');
				setLoading(false);
				setError('Request timeout - please check your connection');
				setSenderNames([]); // Ensure it's always an array
			}
		}, 35000); // 35 second timeout (longer than API 30s timeout)

		return () => clearTimeout(timeout);
	}, []);

	// Recalculate stats whenever senderNames changes
	useEffect(() => {
		if (senderNames.length > 0) {
			const calculatedStats = calculateStatsFromSenderNames(senderNames);
			setStats(calculatedStats);
		}
	}, [senderNames, fetchSenderNames, fetchStats]);

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

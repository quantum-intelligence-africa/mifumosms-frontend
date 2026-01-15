import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { SenderNameRequest, SenderNameStats, CreateSenderNameRequest, UpdateSenderNameRequest } from '@/lib/api';

export function useSenderRequestAPI() {
	const [senderNames, setSenderNames] = useState<SenderNameRequest[]>([]);
	const [stats, setStats] = useState<SenderNameStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Ensure senderNames is always an array
	const safeSenderNames = Array.isArray(senderNames) ? senderNames : [];

	const fetchSenderNames = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiClient.getUserRequests();

			if (response.success && response.data) {
				setSenderNames(response.data.results || []);
			} else {
				console.error('Failed to fetch sender names:', response.error, 'Status:', response.status);

				if (response.status === 403) {
					setError('Authentication failed. Please log in again.');
				} else if (response.status === 401) {
					setError('Session expired. Please log in again.');
				} else {
					setError(response.error || 'Failed to fetch sender names');
				}
				setSenderNames([]);
			}
		} catch (err) {
			console.error('Error fetching sender names:', err);
			setError(err instanceof Error ? err.message : 'An error occurred');
			setSenderNames([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const response = await apiClient.getStatistics();

			if (response.success && response.data) {
				setStats(response.data);
			}
		} catch (err) {
			console.error('Failed to fetch sender name stats:', err);
		}
	};

	const createSenderName = async (data: CreateSenderNameRequest) => {
		try {
			setError(null);
			const response = await apiClient.createSenderNameRequest(data);

			if (response.success && response.data) {
				// Add the new request to the list
				setSenderNames(prev => [response.data!, ...prev]);
				// Refresh stats
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
			const response = await apiClient.updateSenderNameRequest(requestId, data);

			if (response.success && response.data) {
				// Update the request in the list
				setSenderNames(prev => prev.map(req =>
					req.id === requestId ? response.data! : req
				));
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
			const response = await apiClient.deleteSenderNameRequest(requestId);

			if (response.success) {
				// Remove the request from the list
				setSenderNames(prev => prev.filter(req => req.id !== requestId));
				// Refresh stats
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
			const response = await apiClient.getSenderNameRequest(requestId);

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
		fetchSenderNames();
		fetchStats();

		// Add a timeout to prevent infinite loading
		const timeout = setTimeout(() => {
			if (loading) {
				setLoading(false);
				setError('Request timeout - please check your connection');
				setSenderNames([]);
			}
		}, 10000); // 10 second timeout

		return () => clearTimeout(timeout);
	}, []);

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
	};
}

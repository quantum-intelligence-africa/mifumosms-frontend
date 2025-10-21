import { API_CONFIG } from '@/config/api';
import { SenderNameRequest, SenderNameStats, CreateSenderNameRequest, UpdateSenderNameRequest } from '@/lib/api';

interface ApiResponse<T = unknown> {
	data?: T;
	message?: string;
	error?: string;
	success?: boolean;
	status?: number;
}

class SenderRequestAPI {
	private baseURL: string;
	private token: string | null;

	constructor() {
		this.baseURL = API_CONFIG.BASE_URL;
		this.token = localStorage.getItem('access_token');
	}

	// Set authentication token
	setToken(token: string | null) {
		this.token = token;
		if (token) {
			localStorage.setItem('access_token', token);
		} else {
			localStorage.removeItem('access_token');
		}
	}

	// Get headers for authenticated requests
	private getHeaders(includeContentType = true): Record<string, string> {
		const headers: Record<string, string> = {};

		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		if (includeContentType) {
			headers['Content-Type'] = 'application/json';
		}

		return headers;
	}

	// Handle API responses
	private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
		const data = await response.json();
		console.log('Raw API response data:', data);

		if (!response.ok) {
			return {
				data: data,
				error: data.message || data.detail || data.error || 'API request failed',
				status: response.status,
				success: false,
			};
		}

		// Handle backend response format: { "success": true, "data": {...} }
		if (data && typeof data === 'object' && 'success' in data) {
			console.log('Processing success response, data.data:', data.data);
			return {
				data: data.data,
				status: response.status,
				success: data.success,
				message: data.message,
				error: data.success ? undefined : (data.message || data.error),
			};
		}

		console.log('Processing direct response, data:', data);
		return {
			data: data,
			status: response.status,
			success: true,
		};
	}

	// Get sender request statistics
	async getStats(): Promise<ApiResponse<SenderNameStats>> {
		try {
			const statsUrl = `${this.baseURL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.BASE}stats/`;
			const response = await fetch(statsUrl, {
				method: 'GET',
				headers: this.getHeaders()
			});

			return await this.handleResponse<SenderNameStats>(response);
		} catch (error) {
			console.error('Error fetching stats:', error);
			return {
				error: error instanceof Error ? error.message : 'Network error',
				status: 0,
				success: false,
			};
		}
	}

	// Get list of sender requests
	async getRequests(params: {
		status?: string;
		search?: string;
		page?: number;
		page_size?: number;
	} = {}): Promise<ApiResponse<{
		results: SenderNameRequest[];
		count: number;
		next?: string;
		previous?: string;
	}>> {
		try {
			const queryString = new URLSearchParams();
			if (params.status) queryString.append('status', params.status);
			if (params.search) queryString.append('search', params.search);
			if (params.page) queryString.append('page', params.page.toString());
			if (params.page_size) queryString.append('page_size', params.page_size.toString());

			const listUrl = `${this.baseURL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.BASE}`;
			const url = queryString.toString()
				? `${listUrl}?${queryString.toString()}`
				: listUrl;

			console.log('Making request to:', url);
			console.log('Headers:', this.getHeaders());
			console.log('Token:', this.token);

			const response = await fetch(url, {
				method: 'GET',
				headers: this.getHeaders()
			});

			console.log('Response status:', response.status);
			console.log('Response ok:', response.ok);

			return await this.handleResponse<{
				results: SenderNameRequest[];
				count: number;
				next?: string;
				previous?: string;
			}>(response);
		} catch (error) {
			console.error('Error fetching requests:', error);
			return {
				error: error instanceof Error ? error.message : 'Network error',
				status: 0,
				success: false,
			};
		}
	}

	// Submit new sender request
	async submitRequest(data: CreateSenderNameRequest): Promise<ApiResponse<SenderNameRequest>> {
		try {
			const formData = new FormData();
			formData.append('sender_name', data.sender_name);
			formData.append('use_case', data.use_case);

			if (data.supporting_documents) {
				data.supporting_documents.forEach((file) => {
					formData.append('supporting_documents', file);
				});
			}

			const submitUrl = `${this.baseURL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.BASE}`;
			const response = await fetch(submitUrl, {
				method: 'POST',
				headers: this.getHeaders(false), // Don't include Content-Type for FormData
				body: formData
			});

			return await this.handleResponse<SenderNameRequest>(response);
		} catch (error) {
			console.error('Error submitting request:', error);
			return {
				error: error instanceof Error ? error.message : 'Network error',
				status: 0,
				success: false,
			};
		}
	}

	// Get request details
	async getRequestDetails(requestId: string): Promise<ApiResponse<SenderNameRequest>> {
		try {
			const detailUrl = `${this.baseURL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.BASE}${requestId}/`;
			const response = await fetch(detailUrl, {
				method: 'GET',
				headers: this.getHeaders()
			});

			return await this.handleResponse<SenderNameRequest>(response);
		} catch (error) {
			console.error('Error fetching request details:', error);
			return {
				error: error instanceof Error ? error.message : 'Network error',
				status: 0,
				success: false,
			};
		}
	}

	// Update request (admin only)
	async updateRequest(requestId: string, updateData: UpdateSenderNameRequest): Promise<ApiResponse<SenderNameRequest>> {
		try {
			const formData = new FormData();
			if (updateData.sender_name) formData.append('sender_name', updateData.sender_name);
			if (updateData.use_case) formData.append('use_case', updateData.use_case);
			if (updateData.status) formData.append('status', updateData.status);
			if (updateData.admin_notes) formData.append('admin_notes', updateData.admin_notes);

			if (updateData.supporting_documents) {
				updateData.supporting_documents.forEach((file) => {
					formData.append('supporting_documents', file);
				});
			}

			const updateUrl = `${this.baseURL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.BASE}${requestId}/`;
			const response = await fetch(updateUrl, {
				method: 'PUT',
				headers: this.getHeaders(false), // Don't include Content-Type for FormData
				body: formData
			});

			return await this.handleResponse<SenderNameRequest>(response);
		} catch (error) {
			console.error('Error updating request:', error);
			return {
				error: error instanceof Error ? error.message : 'Network error',
				status: 0,
				success: false,
			};
		}
	}

	// Delete request
	async deleteRequest(requestId: string): Promise<ApiResponse> {
		try {
			const deleteUrl = `${this.baseURL}${API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS.BASE}${requestId}/`;
			const response = await fetch(deleteUrl, {
				method: 'DELETE',
				headers: this.getHeaders()
			});

			return await this.handleResponse(response);
		} catch (error) {
			console.error('Error deleting request:', error);
			return {
				error: error instanceof Error ? error.message : 'Network error',
				status: 0,
				success: false,
			};
		}
	}

	// Refresh token and retry request
	async refreshTokenAndRetry<T>(originalRequest: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
		try {
			const refreshToken = localStorage.getItem('refresh_token');
			if (!refreshToken) {
				return {
					error: 'No refresh token available',
					status: 401,
					success: false,
				};
			}

			// Call refresh token endpoint
			const refreshResponse = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh: refreshToken })
			});

			const refreshData = await refreshResponse.json();

			if (refreshResponse.ok && refreshData.access) {
				this.setToken(refreshData.access);
				// Retry original request
				return await originalRequest();
			} else {
				// Refresh failed, clear tokens
				this.setToken(null);
				localStorage.removeItem('refresh_token');
				return {
					error: 'Token refresh failed',
					status: 401,
					success: false,
				};
			}
		} catch (error) {
			console.error('Token refresh error:', error);
			this.setToken(null);
			localStorage.removeItem('refresh_token');
			return {
				error: 'Token refresh failed',
				status: 401,
				success: false,
			};
		}
	}
}

export default new SenderRequestAPI();

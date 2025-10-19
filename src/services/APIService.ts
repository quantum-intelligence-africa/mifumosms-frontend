// Enhanced API service with retry logic and error handling
import { apiClient, ApiResponse } from '@/lib/api';
import { handleAPIError, handleNetworkError, isRetryableError, getRetryDelay, logError } from '@/utils/errorHandler';

export interface RetryOptions {
	maxRetries?: number;
	baseDelay?: number;
	maxDelay?: number;
}

export class APIService {
	private static instance: APIService;
	private retryOptions: RetryOptions;

	constructor(retryOptions: RetryOptions = {}) {
		this.retryOptions = {
			maxRetries: 3,
			baseDelay: 1000,
			maxDelay: 16000,
			...retryOptions
		};
	}

	static getInstance(retryOptions?: RetryOptions): APIService {
		if (!APIService.instance) {
			APIService.instance = new APIService(retryOptions);
		}
		return APIService.instance;
	}

	private async withRetry<T>(
		operation: () => Promise<ApiResponse<T>>,
		context: string,
		retryCount: number = 0
	): Promise<ApiResponse<T>> {
		try {
			const response = await operation();

			if (response.success) {
				return response;
			}

			const errorDetails = handleAPIError(response, context);

			if (isRetryableError(errorDetails) && retryCount < this.retryOptions.maxRetries!) {
				const delay = getRetryDelay(retryCount);
				console.log(`Retrying ${context} in ${delay}ms (attempt ${retryCount + 1}/${this.retryOptions.maxRetries})`);

				await new Promise(resolve => setTimeout(resolve, delay));
				return this.withRetry(operation, context, retryCount + 1);
			}

			return response;
		} catch (error) {
			const errorDetails = handleNetworkError(error, context);

			if (isRetryableError(errorDetails) && retryCount < this.retryOptions.maxRetries!) {
				const delay = getRetryDelay(retryCount);
				console.log(`Retrying ${context} in ${delay}ms (attempt ${retryCount + 1}/${this.retryOptions.maxRetries})`);

				await new Promise(resolve => setTimeout(resolve, delay));
				return this.withRetry(operation, context, retryCount + 1);
			}

			logError(error, context);
			return {
				success: false,
				error: errorDetails.message,
				status: errorDetails.status || 0
			};
		}
	}

	// Authentication methods
	async login(credentials: { email: string; password: string }) {
		return this.withRetry(
			() => apiClient.login(credentials),
			'User login'
		);
	}

	async register(userData: {
		email: string;
		password: string;
		password_confirm: string;
		first_name: string;
		last_name: string;
		phone_number?: string;
	}) {
		return this.withRetry(
			() => apiClient.register(userData),
			'User registration'
		);
	}

	async logout() {
		return this.withRetry(
			() => apiClient.logout(),
			'User logout'
		);
	}

	async getProfile() {
		return this.withRetry(
			() => apiClient.getProfile(),
			'Get user profile'
		);
	}

	// SMS Billing methods
	async getSMSPackages() {
		return this.withRetry(
			() => apiClient.getSMSPackages(),
			'Get SMS packages'
		);
	}

	async getSMSBalance() {
		return this.withRetry(
			() => apiClient.getSMSBalance(),
			'Get SMS balance'
		);
	}

	async getPurchases() {
		return this.withRetry(
			() => apiClient.getPurchases(),
			'Get purchases'
		);
	}

	async getUsageStatistics() {
		return this.withRetry(
			() => apiClient.getUsageStatistics(),
			'Get usage statistics'
		);
	}

	async getPaymentProviders() {
		return this.withRetry(
			() => apiClient.getPaymentProviders(),
			'Get payment providers'
		);
	}

	async initiatePayment(data: {
		package_id: string;
		mobile_money_provider: string;
		phone_number: string;
	}) {
		return this.withRetry(
			() => apiClient.initiatePayment(data),
			'Initiate payment'
		);
	}

	async calculateCustomSMSPrice(credits: number) {
		return this.withRetry(
			() => apiClient.calculateCustomSMSPrice(credits),
			'Calculate custom SMS price'
		);
	}

	async initiateCustomSMSPayment(data: {
		credits: number;
		mobile_money_provider: string;
		phone_number: string;
	}) {
		return this.withRetry(
			() => apiClient.initiateCustomSMSPayment(data),
			'Initiate custom SMS payment'
		);
	}

	async verifyPayment(orderId: string) {
		return this.withRetry(
			() => apiClient.verifyPayment(orderId),
			'Verify payment'
		);
	}

	// Sender ID methods
	async requestDefaultSenderID() {
		return this.withRetry(
			() => apiClient.requestDefaultSenderID(),
			'Request default sender ID'
		);
	}

	async requestCustomSenderID(data: {
		request_type: 'custom';
		requested_sender_id: string;
		sample_content: string;
		business_justification: string;
	}) {
		return this.withRetry(
			() => apiClient.requestCustomSenderID(data),
			'Request custom sender ID'
		);
	}

	async getSenderIDRequests() {
		return this.withRetry(
			() => apiClient.getSenderIDRequests(),
			'Get sender ID requests'
		);
	}

	async getAvailableSenderIDs() {
		return this.withRetry(
			() => apiClient.getAvailableSenderIDs(),
			'Get available sender IDs'
		);
	}

	// Tenant methods
	async getTenants() {
		return this.withRetry(
			() => apiClient.getTenants(),
			'Get tenants'
		);
	}

	async createTenant(tenantData: {
		name: string;
		subdomain: string;
		business_name?: string;
		business_type?: string;
		phone_number?: string;
		email?: string;
	}) {
		return this.withRetry(
			() => apiClient.createTenant(tenantData),
			'Create tenant'
		);
	}

	async switchTenant(tenantId: string) {
		return this.withRetry(
			() => apiClient.switchTenant(tenantId),
			'Switch tenant'
		);
	}

	// Contact methods
	async getContacts(params?: {
		search?: string;
		is_active?: boolean;
		is_opted_in?: boolean;
		page?: number;
		page_size?: number;
	}) {
		return this.withRetry(
			() => apiClient.getContacts(params),
			'Get contacts'
		);
	}

	async createContact(contactData: {
		name: string;
		phone_e164: string;
		email?: string;
		tags?: string[];
		attributes?: Record<string, unknown>;
	}) {
		return this.withRetry(
			() => apiClient.createContact(contactData),
			'Create contact'
		);
	}

	// Campaign methods
	async getCampaigns(params?: {
		status?: string;
		type?: string;
		page?: number;
		page_size?: number;
	}) {
		return this.withRetry(
			() => apiClient.getCampaigns(params),
			'Get campaigns'
		);
	}

	async createCampaign(data: {
		name: string;
		description?: string;
		campaign_type: 'sms' | 'whatsapp' | 'email' | 'mixed';
		message_text: string;
		template?: string | null;
		scheduled_at?: string | null;
		target_contact_ids?: string[];
		target_segment_ids?: string[];
		target_criteria?: {
			tags?: string[];
			opt_in_status?: string;
		};
		settings?: {
			send_time?: string;
			timezone?: string;
		};
		is_recurring?: boolean;
		recurring_schedule?: Record<string, unknown>;
	}) {
		return this.withRetry(
			() => apiClient.createCampaign(data),
			'Create campaign'
		);
	}

	// Dashboard methods
	async getDashboardOverview() {
		return this.withRetry(
			() => apiClient.getDashboardOverview(),
			'Get dashboard overview'
		);
	}

	async getBillingOverview() {
		return this.withRetry(
			() => apiClient.getBillingOverview(),
			'Get billing overview'
		);
	}
}

// Export singleton instance
export const apiService = APIService.getInstance();

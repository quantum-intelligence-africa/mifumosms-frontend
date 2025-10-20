// API Configuration - Updated to match backend API guide
export const API_CONFIG = {
	BASE_URL: 'http://127.0.0.1:8000/api',
	ENDPOINTS: {
		AUTH: {
			LOGIN: '/auth/login/',
			REGISTER: '/auth/register/',
			PROFILE: '/auth/profile/',
			REFRESH: '/auth/token/refresh/',
			LOGOUT: '/auth/logout/',
			PASSWORD_CHANGE: '/auth/password/change/',
			PASSWORD_RESET: '/auth/password/reset/',
			VERIFY_EMAIL: '/auth/verify-email/',
			API_KEY_GENERATE: '/auth/api-key/generate/',
			API_KEY_REVOKE: '/auth/api-key/revoke/',
		},
		TENANTS: {
			BASE: '/tenants/',
			SWITCH: '/tenants/switch/',
			MEMBERS: (id: string) => `/tenants/${id}/members/`,
			DOMAINS: (id: string) => `/tenants/${id}/domains/`,
		},
		MESSAGING: {
			CONTACTS: '/messaging/contacts/',
			SEGMENTS: '/messaging/segments/',
			TEMPLATES: '/messaging/templates/',
			CONVERSATIONS: '/messaging/conversations/',
			MESSAGES: '/messaging/messages/',
			CAMPAIGNS: '/messaging/campaigns/',
			ANALYTICS: '/messaging/analytics/overview/',
			DASHBOARD: '/messaging/dashboard/',
			SMS: {
				SEND: '/messaging/sms/send/',
				STATS: '/messaging/sms/stats/',
				VALIDATE_PHONE: '/messaging/sms/validate-phone/',
				TEST_CONNECTION: '/messaging/sms/test-connection/',
			},
			SENDER_ID_REQUESTS: {
				BASE: '/messaging/sender-id-requests/',
				DEFAULT: '/messaging/sender-id-requests/default/',
				DEFAULT_OVERVIEW: '/messaging/sender-id-requests/default/overview/',
				REQUEST_DEFAULT: '/messaging/sender-id-requests/request-default/',
				CANCEL_DEFAULT: '/messaging/sender-id-requests/cancel-default/',
				STATUS: '/messaging/sender-id-requests/status/',
				AVAILABLE: '/messaging/sender-id-requests/available/',
				USAGE: '/messaging/sender-id-usage/',
			},
		},
		BILLING: {
			PLANS: '/billing/plans/',
			SUBSCRIPTION: '/billing/subscription/',
			USAGE: '/billing/usage/',
			OVERVIEW: '/billing/overview/',
			PAYMENTS: {
				PROVIDERS: '/billing/payments/providers/',
				INITIATE: '/billing/payments/initiate/',
				VERIFY: (orderId: string) => `/billing/payments/verify/${orderId}/`,
				STATUS: (transactionId: string) => `/billing/payments/transactions/${transactionId}/status/`,
				PROGRESS: (transactionId: string) => `/billing/payments/transactions/${transactionId}/progress/`,
				ACTIVE: (transactionId: string) => `/billing/payments/transactions/${transactionId}/active/`,
				CANCEL: (transactionId: string) => `/billing/payments/transactions/${transactionId}/cancel/`,
				CLEANUP: (transactionId: string) => `/billing/payments/transactions/${transactionId}/cleanup/`,
				CUSTOM_CALCULATE: '/billing/payments/custom-sms/calculate/',
				CUSTOM_INITIATE: '/billing/payments/custom-sms/initiate/',
			},
			SMS: {
				BALANCE: '/billing/sms/balance/',
				PACKAGES: '/billing/sms/packages/',
				PURCHASE: '/billing/sms/purchase/',
				PURCHASES: '/billing/sms/purchases/',
				PURCHASE_HISTORY: '/billing/sms/purchases/history/',
				USAGE_STATISTICS: '/billing/sms/usage/statistics/',
			},
			HISTORY: {
				BASE: '/billing/history/',
				SUMMARY: '/billing/history/summary/',
				PURCHASES: '/billing/history/purchases/',
				PAYMENTS: '/billing/history/payments/',
				USAGE: '/billing/history/usage/',
				COMPREHENSIVE: '/billing/history/comprehensive/',
			},
		},
	},
} as const;

// Helper function to build full URLs
export const buildApiUrl = (endpoint: string): string => {
	return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get sender request endpoints
export const getSenderRequestEndpoints = () => API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS;

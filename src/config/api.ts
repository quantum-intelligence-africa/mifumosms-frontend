// API Configuration - Updated to match backend API guide
export const API_CONFIG = {
	BASE_URL: 'http://104.131.116.55/api',
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
				CUSTOM_CALCULATE: '/billing/payments/custom-sms/calculate/',
				CUSTOM_INITIATE: '/billing/payments/custom-sms/initiate/',
			},
			SMS: {
				BALANCE: '/billing/sms/balance/',
				PACKAGES: '/billing/sms/packages/',
				PURCHASES: '/billing/sms/purchases/',
				PURCHASE_HISTORY: '/billing/sms/purchases/history/',
				USAGE_STATISTICS: '/billing/sms/usage/statistics/',
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

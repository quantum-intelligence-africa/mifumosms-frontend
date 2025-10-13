// API Configuration
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
			SENDER_REQUESTS: {
				BASE: '/messaging/sender-requests/',
				STATS: '/messaging/sender-requests/stats/',
				SUBMIT: '/messaging/sender-requests/submit/',
				LIST: '/messaging/sender-requests/',
				DETAIL: (id: string) => `/messaging/sender-requests/${id}/`,
				UPDATE: (id: string) => `/messaging/sender-requests/${id}/update/`,
				DELETE: (id: string) => `/messaging/sender-requests/${id}/delete/`,
			},
		},
		BILLING: {
			PLANS: '/billing/plans/',
			SUBSCRIPTION: '/billing/subscription/',
			USAGE: '/billing/usage/',
			OVERVIEW: '/billing/overview/',
			SMS: {
				BALANCE: '/billing/sms/balance/',
				PACKAGES: '/billing/sms/packages/',
				PURCHASE: '/billing/sms/purchase/',
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
export const getSenderRequestEndpoints = () => API_CONFIG.ENDPOINTS.MESSAGING.SENDER_REQUESTS;

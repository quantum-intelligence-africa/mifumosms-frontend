// API Configuration - Updated to match backend API guide
export const API_CONFIG = {
	// BASE_URL: 'https://mifumosms.servehttp.com/api',
	BASE_URL: 'https://mifumosms.servehttp.com/api',

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
			SMS: {
				SEND_CODE: '/auth/sms/send-code/',
				VERIFY_CODE: '/auth/sms/verify-code/',
				FORGOT_PASSWORD: '/auth/sms/forgot-password/',
				RESET_PASSWORD: '/auth/sms/reset-password/',
				CONFIRM_ACCOUNT: '/auth/sms/confirm-account/',
			},
			SETTINGS: {
				PROFILE: '/auth/settings/profile/',
				PREFERENCES: '/auth/settings/preferences/',
				NOTIFICATIONS: '/auth/settings/notifications/',
				SECURITY: '/auth/settings/security/',
				API: '/auth/settings/',
				KEYS: {
					CREATE: '/auth/keys/create/',
					REVOKE: (keyId: string) => `/auth/keys/${keyId}/revoke/`,
					REGENERATE: (keyId: string) => `/auth/keys/${keyId}/regenerate/`,
				},
				WEBHOOKS: {
					CREATE: '/auth/webhooks/create/',
					TOGGLE: (webhookId: string) => `/auth/webhooks/${webhookId}/toggle/`,
					DELETE: (webhookId: string) => `/auth/webhooks/${webhookId}/delete/`,
				},
			},
		},
		TENANTS: {
			BASE: '/tenants/',
			SWITCH: '/tenants/switch/',
			MEMBERS: (id: string) => `/tenants/${id}/members/`,
			DOMAINS: (id: string) => `/tenants/${id}/domains/`,
		},
		MESSAGING: {
			CONTACTS: {
				BASE: '/messaging/contacts/',
				BULK_IMPORT: '/messaging/contacts/bulk-import/',
				MOBILE_IMPORT: '/messaging/contacts/import/',
				DETAIL: (id: string) => `/messaging/contacts/${id}/`,
			},
			SEGMENTS: '/messaging/segments/',
			TEMPLATES: '/messaging/templates/',
			TEMPLATE_ACTIONS: {
				TOGGLE_FAVORITE: (id: string) => `/messaging/templates/${id}/toggle-favorite/`,
				INCREMENT_USAGE: (id: string) => `/messaging/templates/${id}/increment-usage/`,
				APPROVE: (id: string) => `/messaging/templates/${id}/approve/`,
				REJECT: (id: string) => `/messaging/templates/${id}/reject/`,
				VARIABLES: (id: string) => `/messaging/templates/${id}/variables/`,
				COPY: (id: string) => `/messaging/templates/${id}/copy/`,
			},
			TEMPLATE_STATISTICS: '/messaging/templates/statistics/',
			CONVERSATIONS: '/messaging/conversations/',
			MESSAGES: '/messaging/messages/',
			CAMPAIGNS: {
				BASE: '/messaging/campaigns/',
				SUMMARY: '/messaging/campaigns/summary/',
			},
			ANALYTICS: '/messaging/analytics/overview/',
			DASHBOARD: {
				OVERVIEW: '/messaging/dashboard/overview/',
				METRICS: '/messaging/dashboard/metrics/',
				COMPREHENSIVE: '/messaging/dashboard/comprehensive/',
			},
			ACTIVITY: {
				RECENT: '/messaging/activity/recent/',
			},
			PERFORMANCE: {
				OVERVIEW: '/messaging/performance/overview/',
			},
			SENDER_IDS: {
				BASE: '/messaging/sender-ids/',
			},
			SMS: {
				SEND: '/messaging/sms/send/',
				STATS: '/messaging/sms/stats/',
				VALIDATE_PHONE: '/messaging/sms/validate-phone/',
				TEST_CONNECTION: '/messaging/sms/test-connection/',
				DELIVERY_REPORTS: '/sms/delivery-reports/',
				BALANCE: '/sms/balance/',
				STATUS: (messageId: string) => `/sms/status/${messageId}/`,
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
		NOTIFICATIONS: {
			BASE: '/notifications/',
			RECENT: '/notifications/recent/',
			REAL: '/notifications/real/',
			UNREAD_COUNT: '/notifications/unread-count/',
			MARK_READ: (id: string) => `/notifications/${id}/mark-read/`,
			MARK_ALL_READ: '/notifications/mark-all-read/',
			STATS: '/notifications/stats/',
			SETTINGS: '/notifications/settings/',
			SMS_CREDIT_TEST: '/notifications/sms-credit/test/',
			SYSTEM_CREATE: '/notifications/system/create/',
			SYSTEM_HEALTH_CHECK: '/notifications/system/health-check/',
			SYSTEM_REPORT_PROBLEM: '/notifications/system/report-problem/',
			SYSTEM_CLEANUP: '/notifications/system/cleanup/',
			TEMPLATES: '/notifications/templates/',
		},
	},
} as const;

// Helper function to build full URLs
export const buildApiUrl = (endpoint: string): string => {
	return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get sender request endpoints
export const getSenderRequestEndpoints = () => API_CONFIG.ENDPOINTS.MESSAGING.SENDER_ID_REQUESTS;

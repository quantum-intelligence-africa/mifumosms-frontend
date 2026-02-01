// Error handling utilities for API calls
import { ApiResponse } from '@/lib/api';
import { logger } from '@/utils/logger';

export interface ErrorDetails {
	message: string;
	status?: number;
	field?: string;
	code?: string;
}

export class APIError extends Error {
	public status: number;
	public field?: string;
	public code?: string;

	constructor(message: string, status: number = 500, field?: string, code?: string) {
		super(message);
		this.name = 'APIError';
		this.status = status;
		this.field = field;
		this.code = code;
	}
}

export const handleAPIError = (response: ApiResponse, context: string = 'API call'): ErrorDetails => {
	logger.error(`${context} failed`);

	if (!response.success) {
		// Handle specific error types
		switch (response.status) {
			case 400:
				return {
					message: response.error || 'Invalid request. Please check your input.',
					status: 400,
					code: 'VALIDATION_ERROR'
				};

			case 401:
				return {
					message: 'Authentication required. Please log in again.',
					status: 401,
					code: 'AUTHENTICATION_ERROR'
				};

			case 403:
				return {
					message: 'Access denied. You don\'t have permission for this action.',
					status: 403,
					code: 'AUTHORIZATION_ERROR'
				};

			case 404:
				return {
					message: 'Resource not found.',
					status: 404,
					code: 'NOT_FOUND_ERROR'
				};

			case 409:
				return {
					message: 'Conflict. The resource already exists or is in use.',
					status: 409,
					code: 'CONFLICT_ERROR'
				};

			case 422:
				return {
					message: response.error || 'Validation failed. Please check your input.',
					status: 422,
					code: 'VALIDATION_ERROR'
				};

			case 429:
				return {
					message: 'Too many requests. Please try again later.',
					status: 429,
					code: 'RATE_LIMIT_ERROR'
				};

			case 500:
				return {
					message: 'Server error. Please try again later.',
					status: 500,
					code: 'SERVER_ERROR'
				};

			case 502:
			case 503:
			case 504:
				return {
					message: 'Service temporarily unavailable. Please try again later.',
					status: response.status,
					code: 'SERVICE_UNAVAILABLE'
				};

			default:
				return {
					message: response.error || 'An unexpected error occurred.',
					status: response.status || 0,
					code: 'UNKNOWN_ERROR'
				};
		}
	}

	return {
		message: 'An unexpected error occurred.',
		status: 0,
		code: 'UNKNOWN_ERROR'
	};
};

export const handleNetworkError = (error: unknown, context: string = 'Network request'): ErrorDetails => {
	logger.error(`${context} network error`);

	if (error instanceof TypeError && error.message.includes('fetch')) {
		return {
			message: 'Network error. Please check your internet connection.',
			status: 0,
			code: 'NETWORK_ERROR'
		};
	}

	if (error instanceof Error) {
		return {
			message: error.message,
			status: 0,
			code: 'NETWORK_ERROR'
		};
	}

	return {
		message: 'An unexpected network error occurred.',
		status: 0,
		code: 'NETWORK_ERROR'
	};
};

export const isRetryableError = (error: ErrorDetails): boolean => {
	const retryableStatuses = [408, 429, 500, 502, 503, 504];
	const retryableCodes = ['NETWORK_ERROR', 'RATE_LIMIT_ERROR', 'SERVER_ERROR', 'SERVICE_UNAVAILABLE'];

	return retryableStatuses.includes(error.status || 0) ||
		retryableCodes.includes(error.code || '');
};

export const getRetryDelay = (attempt: number): number => {
	// Exponential backoff: 1s, 2s, 4s, 8s, 16s
	return Math.min(1000 * Math.pow(2, attempt), 16000);
};

export const formatValidationErrors = (errors: Record<string, string[]>): string => {
	return Object.entries(errors)
		.map(([field, messages]) => `${field}: ${messages.join(', ')}`)
		.join('; ');
};

export const getErrorMessage = (error: unknown, fallback: string = 'An error occurred'): string => {
	if (error instanceof APIError) {
		return error.message;
	}

	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	return fallback;
};

export const logError = (error: unknown, context: string = 'Application'): void => {
	logger.error(`${context}: Error occurred`, { type: error instanceof Error ? error.constructor.name : typeof error });

	// In production, you might want to send this to an error tracking service
	// like Sentry, LogRocket, or Bugsnag
	if (import.meta.env.MODE === 'production') {
		// Example: Sentry.captureException(error);
	}
};

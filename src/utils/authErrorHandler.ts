/**
 * Global Authentication Error Handler
 *
 * Handles authentication errors across all endpoints and redirects user to login
 * when token is expired, invalid, or missing.
 */

// Event emitter for authentication errors
type AuthErrorListener = () => void;

const authErrorListeners: Set<AuthErrorListener> = new Set();

/**
 * Subscribe to authentication errors
 * Called when token is expired or authentication fails globally
 */
export const onAuthenticationError = (callback: AuthErrorListener): (() => void) => {
	authErrorListeners.add(callback);

	// Return unsubscribe function
	return () => {
		authErrorListeners.delete(callback);
	};
};

/**
 * Emit authentication error event
 * This triggers all registered listeners to redirect user to login
 */
export const emitAuthenticationError = (reason: 'token-expired' | 'no-token' | 'invalid-token' | 'unauthorized' | 'inactivity') => {
	console.warn(`[Auth Error] Authentication failed: ${reason}`);

	// Clear authentication data
	localStorage.removeItem('access_token');
	localStorage.removeItem('refresh_token');
	localStorage.removeItem('user');

	// Notify all listeners
	authErrorListeners.forEach(listener => {
		try {
			listener();
		} catch (error) {
			console.error('Error in auth error listener:', error);
		}
	});
};

/**
 * Check if error response indicates authentication is required
 */
export const isAuthenticationError = (
	status: number,
	data?: Record<string, unknown>,
	errorMsg?: string
): boolean => {
	// Check HTTP status codes
	if (status === 401 || status === 403) {
		return true;
	}

	// Check error message
	if (errorMsg) {
		const lowerError = errorMsg.toLowerCase();
		if (
			lowerError.includes('authentication') ||
			lowerError.includes('token expired') ||
			lowerError.includes('token invalid') ||
			lowerError.includes('token missing') ||
			lowerError.includes('unauthorized') ||
			lowerError.includes('not authenticated') ||
			lowerError.includes('permission denied') ||
			lowerError.includes('need authentication')
		) {
			return true;
		}
	}

	// Check response data
	if (data && typeof data === 'object') {
		const error = ((data.error || data.message) || '').toString().toLowerCase();
		if (
			error.includes('authentication') ||
			error.includes('token expired') ||
			error.includes('token invalid') ||
			error.includes('unauthorized') ||
			error.includes('not authenticated')
		) {
			return true;
		}
	}

	return false;
};

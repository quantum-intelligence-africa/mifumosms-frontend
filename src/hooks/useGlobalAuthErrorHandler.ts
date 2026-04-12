import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { onAuthenticationError } from '@/utils/authErrorHandler';

/**
 * Hook that automatically redirects to login page when authentication fails
 *
 * Call this hook in your root component (e.g., App.tsx) or any layout component
 * to enable global authentication error handling across all pages.
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useGlobalAuthErrorHandler();
 *   // ... rest of your component
 * }
 * ```
 */
export const useGlobalAuthErrorHandler = () => {
	const navigate = useNavigate();
	const auth = useAuth();

	useEffect(() => {
		// Subscribe to authentication errors globally
		const unsubscribe = onAuthenticationError(() => {
			// Clear user from auth context
			if (auth && typeof auth.logout === 'function') {
				auth.logout().catch(error => {
					console.error('Error during logout redirect:', error);
				});
			}

			// Silently redirect to login without showing messages for better UX
			navigate('/login', {
				state: {
					from: window.location.pathname,
				},
				replace: true
			});
		});

		return () => {
			unsubscribe();
		};
	}, [navigate, auth]);
};

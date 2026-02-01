import { useState, useEffect } from 'react';
import { apiClient, ApiKey, ApiSettings } from '@/lib/api';

export function useApiKeys() {
	const [apiSettings, setApiSettings] = useState<ApiSettings | null>(null);
	const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchApiSettings = async () => {
		try {
			setLoading(true);
			setError(null);

			const response = await apiClient.getAPISettings();

			if (response.success && response.data) {
				setApiSettings(response.data as ApiSettings);
				// Extract API keys from response
				const keys = (response.data as any).api_keys || [];
				setApiKeys(keys);
			} else {
				setError(response.error || 'Failed to fetch API settings');
				setApiKeys([]);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred');
			setApiKeys([]);
		} finally {
			setLoading(false);
		}
	};

	const createApiKey = async (keyData: { key_name: string; permissions: string[] }) => {
		try {
			setError(null);

			const response = await apiClient.createAPIKey({
				key_name: keyData.key_name,
				permissions: keyData.permissions as any,
			});

			if (response.success) {
				// Refresh API keys list
				await fetchApiSettings();
				return { success: true, data: response.data };
			} else {
				return { success: false, error: response.error || 'Failed to create API key' };
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'An error occurred';
			return { success: false, error: errorMsg };
		}
	};

	const revokeApiKey = async (keyId: string) => {
		try {
			setError(null);

			const response = await apiClient.revokeAPIKey(keyId);

			if (response.success) {
				// Refresh API keys list
				await fetchApiSettings();
				return { success: true };
			} else {
				return { success: false, error: response.error || 'Failed to revoke API key' };
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'An error occurred';
			return { success: false, error: errorMsg };
		}
	};

	useEffect(() => {
		fetchApiSettings();
	}, []);

	return {
		apiSettings,
		apiKeys,
		loading,
		error,
		fetchApiSettings,
		createApiKey,
		revokeApiKey,
	};
}

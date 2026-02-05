import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

export interface UserPreferences {
	theme: 'light' | 'dark' | 'system';
	language: 'en' | 'sw';
	timezone: string;
	date_format: string;
	time_format: string;
	email_notifications: boolean;
	sms_notifications: boolean;
	marketing_emails: boolean;
}

export interface UsePreferencesReturn {
	preferences: UserPreferences | null;
	isLoading: boolean;
	isSaving: boolean;
	error: string | null;
	updateTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
	updateLanguage: (language: 'en' | 'sw') => Promise<void>;
	updateTimezone: (timezone: string) => Promise<void>;
	updateNotifications: (
		type: 'email' | 'sms' | 'marketing',
		enabled: boolean
	) => Promise<void>;
	fetchPreferences: () => Promise<void>;
	updateAllPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
	theme: 'light',
	language: 'en',
	timezone: 'Africa/Dar_es_Salaam',
	date_format: 'DD/MM/YYYY',
	time_format: '24h',
	email_notifications: true,
	sms_notifications: false,
	marketing_emails: true,
};

export function usePreferences(): UsePreferencesReturn {
	const { theme, setTheme } = useTheme();
	const { language, setLanguage } = useLanguage();
	const { toast } = useToast();
	const [preferences, setPreferences] = useState<UserPreferences | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch user preferences from API
	const fetchPreferences = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await apiClient.getPreferences();
			if (response.success && response.data) {
				const theme = (response.data.theme as 'light' | 'dark' | 'system') || DEFAULT_PREFERENCES.theme;

				// Get current language from localStorage (user's most recent choice)
				const currentLocalLanguage = localStorage.getItem('language-preference') as 'en' | 'sw' | null;

				// Use localStorage language if available (user just changed it), otherwise use API language
				const language = (currentLocalLanguage || (response.data.language === 'sw' ? 'sw' : 'en')) as 'en' | 'sw';

				const prefs: UserPreferences = {
					theme,
					language,
					timezone: response.data.timezone || DEFAULT_PREFERENCES.timezone,
					date_format: response.data.date_format || DEFAULT_PREFERENCES.date_format,
					time_format: response.data.time_format || DEFAULT_PREFERENCES.time_format,
					email_notifications: DEFAULT_PREFERENCES.email_notifications,
					sms_notifications: DEFAULT_PREFERENCES.sms_notifications,
					marketing_emails: DEFAULT_PREFERENCES.marketing_emails,
				};
				setPreferences(prefs);

				// Only update language if it's different - avoid unnecessary re-renders
				// This respects localStorage preference over API
				if (language) {
					setLanguage(language);
				}
			} else {
				// Set defaults if API fails
				setPreferences(DEFAULT_PREFERENCES);
				// Only apply language, not theme
				setLanguage(DEFAULT_PREFERENCES.language);
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to load preferences';
			setError(errorMsg);

			// Try to use localStorage as fallback for language only
			const savedLanguage = localStorage.getItem('language-preference') as 'en' | 'sw' | null;

			setPreferences({
				...DEFAULT_PREFERENCES,
				language: savedLanguage || DEFAULT_PREFERENCES.language,
			});

			// Only apply language on error, not theme
			if (savedLanguage) {
				setLanguage(savedLanguage);
			}
		} finally {
			setIsLoading(false);
		}
	}, [setLanguage]);

	// Load preferences on mount only (once)
	useEffect(() => {
		let isMounted = true;

		const loadPreferences = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const response = await apiClient.getPreferences();
				if (!isMounted) return; // Don't update if component unmounted

				if (response.success && response.data) {
					const theme = (response.data.theme as 'light' | 'dark' | 'system') || DEFAULT_PREFERENCES.theme;

					// Get current language from localStorage (user's most recent choice)
					const currentLocalLanguage = localStorage.getItem('language-preference') as 'en' | 'sw' | null;

					// Use localStorage language if available (user just changed it), otherwise use API language
					const language = (currentLocalLanguage || (response.data.language === 'sw' ? 'sw' : 'en')) as 'en' | 'sw';

					const prefs: UserPreferences = {
						theme,
						language,
						timezone: response.data.timezone || DEFAULT_PREFERENCES.timezone,
						date_format: response.data.date_format || DEFAULT_PREFERENCES.date_format,
						time_format: response.data.time_format || DEFAULT_PREFERENCES.time_format,
						email_notifications: DEFAULT_PREFERENCES.email_notifications,
						sms_notifications: DEFAULT_PREFERENCES.sms_notifications,
						marketing_emails: DEFAULT_PREFERENCES.marketing_emails,
					};
					setPreferences(prefs);

					// Only apply language if it's different - avoid unnecessary re-renders
					// This respects localStorage preference over API
					if (language) {
						setLanguage(language);
					}
				} else {
					// Set defaults if API fails
					setPreferences(DEFAULT_PREFERENCES);
					// Only set language, not theme
					setLanguage(DEFAULT_PREFERENCES.language);
				}
			} catch (err) {
				if (!isMounted) return;

				const errorMsg = err instanceof Error ? err.message : 'Failed to load preferences';
				setError(errorMsg);

				// Use localStorage as fallback - next-themes stores theme automatically
				const savedLanguage = localStorage.getItem('language-preference') as 'en' | 'sw' | null;

				const fallbackPrefs: UserPreferences = {
					...DEFAULT_PREFERENCES,
					language: savedLanguage || DEFAULT_PREFERENCES.language,
				};

				setPreferences(fallbackPrefs);
				// Theme is already handled by next-themes
				setLanguage(fallbackPrefs.language);
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadPreferences();

		return () => {
			isMounted = false; // Cleanup
		};
	}, [setLanguage]); // Include setLanguage dependency

	// Update theme preference
	const updateTheme = useCallback(
		async (newTheme: 'light' | 'dark' | 'system') => {
			try {
				setIsSaving(true);
				setError(null);

				// Apply theme immediately - next-themes handles localStorage automatically
				setTheme(newTheme);

				// Update local state
				setPreferences((prev) =>
					prev ? { ...prev, theme: newTheme } : null
				);

				// Save to API
				const response = await apiClient.updatePreferences({
					theme: newTheme,
					language: preferences?.language,
					timezone: preferences?.timezone,
				});

				if (!response.success) {
					throw new Error('Failed to save theme preference');
				}

				toast({
					title: 'Theme Updated',
					description: `Theme changed to ${newTheme}`,
				});
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to update theme';
				setError(errorMsg);
				toast({
					title: 'Error',
					description: errorMsg,
					variant: 'destructive',
				});
				// Revert theme on error
				if (preferences?.theme) {
					setTheme(preferences.theme);
				}
			} finally {
				setIsSaving(false);
			}
		},
		[preferences, setTheme, toast]
	);

	// Update language preference
	const updateLanguage = useCallback(
		async (newLanguage: 'en' | 'sw') => {
			try {
				setIsSaving(true);
				setError(null);

				// Apply language immediately - setLanguage handles localStorage
				setLanguage(newLanguage);

				// Update local state
				setPreferences((prev) =>
					prev ? { ...prev, language: newLanguage } : null
				);

				// Save to API
				const response = await apiClient.updatePreferences({
					language: newLanguage,
					theme: preferences?.theme,
					timezone: preferences?.timezone,
				});

				if (!response.success) {
					throw new Error('Failed to save language preference');
				}

				toast({
					title: 'Language Updated',
					description: `Language changed to ${newLanguage === 'sw' ? 'Kiswahili' : 'English'}`,
				});
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to update language';
				setError(errorMsg);
				toast({
					title: 'Error',
					description: errorMsg,
					variant: 'destructive',
				});
				// Revert language on error
				if (preferences?.language) {
					setLanguage(preferences.language);
				}
			} finally {
				setIsSaving(false);
			}
		},
		[preferences, setLanguage, toast]
	);

	// Update timezone preference
	const updateTimezone = useCallback(
		async (newTimezone: string) => {
			try {
				setIsSaving(true);
				setError(null);

				// Update local state
				setPreferences((prev) =>
					prev ? { ...prev, timezone: newTimezone } : null
				);

				// Store in localStorage for instant fallback
				localStorage.setItem('timezone-preference', newTimezone);

				// Save to API
				const response = await apiClient.updatePreferences({
					timezone: newTimezone,
					language: preferences?.language,
					theme: preferences?.theme,
				});

				if (!response.success) {
					throw new Error('Failed to save timezone preference');
				}

				// Store timezone in localStorage for immediate use
				localStorage.setItem('userTimezone', newTimezone);

				toast({
					title: 'Timezone Updated',
					description: `Timezone changed to ${newTimezone}`,
				});
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to update timezone';
				setError(errorMsg);
				toast({
					title: 'Error',
					description: errorMsg,
					variant: 'destructive',
				});
			} finally {
				setIsSaving(false);
			}
		},
		[preferences, toast]
	);

	// Update notification preferences
	const updateNotifications = useCallback(
		async (type: 'email' | 'sms' | 'marketing', enabled: boolean) => {
			try {
				setIsSaving(true);
				setError(null);

				// Update local state
				const updateKey =
					type === 'email'
						? 'email_notifications'
						: type === 'sms'
							? 'sms_notifications'
							: 'marketing_emails';

				setPreferences((prev) =>
					prev ? { ...prev, [updateKey]: enabled } : null
				);

				// Save to API
				const notifSettings: Record<string, boolean> = {};
				notifSettings[`${type}_notifications`] = enabled;

				const response = await apiClient.updateNotificationSettings(notifSettings);

				if (!response.success) {
					throw new Error('Failed to save notification preference');
				}

				toast({
					title: 'Notifications Updated',
					description: `${type === 'email'
						? 'Email'
						: type === 'sms'
							? 'SMS'
							: 'Marketing'
						} notifications ${enabled ? 'enabled' : 'disabled'}`,
				});
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to update notifications';
				setError(errorMsg);
				toast({
					title: 'Error',
					description: errorMsg,
					variant: 'destructive',
				});
				// Revert state on error
				await fetchPreferences();
			} finally {
				setIsSaving(false);
			}
		},
		[toast, fetchPreferences]
	);

	// Update all preferences at once
	const updateAllPreferences = useCallback(
		async (updatedPrefs: Partial<UserPreferences>) => {
			try {
				setIsSaving(true);
				setError(null);

				// Separate theme/language from other preferences
				const { theme: newTheme, language: newLanguage, ...otherPrefs } = updatedPrefs;

				// Apply theme and language immediately
				if (newTheme) setTheme(newTheme);
				if (newLanguage) setLanguage(newLanguage);

				// Update local state
				setPreferences((prev) =>
					prev ? { ...prev, ...updatedPrefs } : null
				);

				// Save to API
				const response = await apiClient.updatePreferences({
					language: newLanguage || preferences?.language,
					theme: newTheme || preferences?.theme,
					timezone: otherPrefs.timezone || preferences?.timezone,
				});

				if (!response.success) {
					throw new Error('Failed to save preferences');
				}

				toast({
					title: 'Preferences Updated',
					description: 'All your preferences have been saved successfully',
				});
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to update preferences';
				setError(errorMsg);
				toast({
					title: 'Error',
					description: errorMsg,
					variant: 'destructive',
				});
				// Revert to saved state on error
				await fetchPreferences();
			} finally {
				setIsSaving(false);
			}
		},
		[preferences, setTheme, setLanguage, toast, fetchPreferences]
	);

	return {
		preferences,
		isLoading,
		isSaving,
		error,
		updateTheme,
		updateLanguage,
		updateTimezone,
		updateNotifications,
		fetchPreferences,
		updateAllPreferences,
	};
}

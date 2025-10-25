import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { API_CONFIG } from '@/config/api';

interface SMSVerificationResponse {
	success: boolean;
	error?: string;
	phone_number?: string;
	attempts_remaining?: number;
	locked_until?: string;
}

interface PasswordResetResponse {
	success: boolean;
	error?: string;
}

interface AccountVerificationResponse {
	success: boolean;
	error?: string;
	phone_number?: string;
	attempts_remaining?: number;
	locked_until?: string;
}

export const useSMSVerification = () => {
	const [isSendingCode, setIsSendingCode] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);

	const requestPasswordReset = async (data: { phone_number: string }): Promise<SMSVerificationResponse> => {
		setIsSendingCode(true);
		try {
			const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.FORGOT_PASSWORD}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				return {
					success: true,
					phone_number: result.phone_number,
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			} else {
				return {
					success: false,
					error: result.error || result.detail || 'Failed to send reset code',
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please try again.',
			};
		} finally {
			setIsSendingCode(false);
		}
	};

	const sendVerificationCode = async (data: { phone_number: string }): Promise<SMSVerificationResponse> => {
		setIsSendingCode(true);
		try {
			const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.SEND_CODE}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				return {
					success: true,
					phone_number: result.phone_number,
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			} else {
				return {
					success: false,
					error: result.error || result.detail || 'Failed to send verification code',
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please try again.',
			};
		} finally {
			setIsSendingCode(false);
		}
	};

	const verifyCode = async (data: { phone_number: string; code: string }): Promise<SMSVerificationResponse> => {
		setIsVerifying(true);
		try {
			const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.VERIFY_CODE}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				return {
					success: true,
					phone_number: result.phone_number,
				};
			} else {
				return {
					success: false,
					error: result.error || result.detail || 'Invalid verification code',
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please try again.',
			};
		} finally {
			setIsVerifying(false);
		}
	};

	const resetPassword = async (data: {
		phone_number: string;
		verification_code: string;
		new_password: string;
	}): Promise<PasswordResetResponse> => {
		try {
			const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.RESET_PASSWORD}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				return {
					success: true,
				};
			} else {
				return {
					success: false,
					error: result.error || result.detail || 'Failed to reset password',
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please try again.',
			};
		}
	};

	const sendAccountVerification = async (data: { phone_number: string }): Promise<AccountVerificationResponse> => {
		setIsSendingCode(true);
		try {
			const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.SEND_VERIFICATION_LINK}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				return {
					success: true,
					phone_number: result.phone_number,
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			} else {
				return {
					success: false,
					error: result.error || result.detail || 'Failed to send verification SMS',
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please try again.',
			};
		} finally {
			setIsSendingCode(false);
		}
	};

	const verifyAccount = async (data: { phone_number: string; code: string }): Promise<AccountVerificationResponse> => {
		setIsVerifying(true);
		try {
			const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.VERIFY_ACCOUNT_LINK}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				return {
					success: true,
					phone_number: result.phone_number,
				};
			} else {
				return {
					success: false,
					error: result.error || result.detail || 'Invalid verification code',
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please try again.',
			};
		} finally {
			setIsVerifying(false);
		}
	};

	const resendAccountVerification = async (data: { phone_number: string }): Promise<AccountVerificationResponse> => {
		setIsSendingCode(true);
		try {
			const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.RESEND_VERIFICATION_LINK}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (response.ok) {
				return {
					success: true,
					phone_number: result.phone_number,
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			} else {
				return {
					success: false,
					error: result.error || result.detail || 'Failed to resend verification SMS',
					attempts_remaining: result.attempts_remaining,
					locked_until: result.locked_until,
				};
			}
		} catch (error) {
			return {
				success: false,
				error: 'Network error. Please try again.',
			};
		} finally {
			setIsSendingCode(false);
		}
	};

	return {
		requestPasswordReset,
		sendVerificationCode,
		verifyCode,
		resetPassword,
		sendAccountVerification,
		verifyAccount,
		resendAccountVerification,
		isSendingCode,
		isVerifying,
	};
};

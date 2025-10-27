import { useState } from 'react';

const API_BASE_URL = 'https://mifumosms.servehttp.com/api';

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
			const formattedNumber = data.phone_number.trim();
			const response = await fetch(`${API_BASE_URL}/auth/sms/forgot-password/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ phone_number: formattedNumber }),
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

	const sendVerificationCode = async (data: { phone_number: string; message_type?: string }): Promise<SMSVerificationResponse> => {
		setIsSendingCode(true);
		try {
			const formattedNumber = data.phone_number.trim();
			const response = await fetch(`${API_BASE_URL}/auth/sms/send-code/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					phone_number: formattedNumber,
					message_type: data.message_type || 'verification'
				}),
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

	const verifyCode = async (data: { phone_number: string; verification_code: string }): Promise<SMSVerificationResponse> => {
		setIsVerifying(true);
		try {
			const formattedNumber = data.phone_number.trim();
			const response = await fetch(`${API_BASE_URL}/auth/sms/verify-code/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					phone_number: formattedNumber,
					verification_code: data.verification_code
				}),
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
		new_password_confirm: string;
	}): Promise<PasswordResetResponse> => {
		try {
			const formattedNumber = data.phone_number.trim();
			const response = await fetch(`${API_BASE_URL}/auth/sms/reset-password/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					phone_number: formattedNumber,
					verification_code: data.verification_code,
					new_password: data.new_password,
					new_password_confirm: data.new_password_confirm
				}),
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
			const formattedNumber = data.phone_number.trim();
			const response = await fetch(`${API_BASE_URL}/auth/sms/send-code/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					phone_number: formattedNumber,
					message_type: 'account_confirmation'
				}),
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

	const verifyAccount = async (data: { verification_code: string }): Promise<AccountVerificationResponse> => {
		setIsVerifying(true);
		try {
			const token = localStorage.getItem('access_token');
			if (!token) {
				return {
					success: false,
					error: 'Authentication required. Please log in.',
				};
			}

			const response = await fetch(`${API_BASE_URL}/auth/sms/confirm-account/`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					verification_code: data.verification_code
				}),
			});

			const result = await response.json();

			if (response.ok) {
				return {
					success: true,
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
		// Reuse sendAccountVerification for resending
		return sendAccountVerification(data);
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

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';
import { normalizePhoneNumber, toBackendPhoneFormat } from '@/utils/phoneUtils';

export interface SMSVerificationRequest {
  phone_number: string;
  message_type?: 'verification' | 'password_reset' | 'account_confirmation';
}

export interface SMSVerificationResponse {
  success: boolean;
  message: string;
  phone_number?: string;
  error?: string;
  attempts_remaining?: number;
  locked_until?: string;
}

export interface VerifyCodeRequest {
  phone_number: string;
  verification_code: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  phone_verified?: boolean;
  error?: string;
  attempts_remaining?: number;
}

export interface ForgotPasswordRequest {
  phone_number: string;
}

export interface ResetPasswordRequest {
  phone_number: string;
  verification_code: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ConfirmAccountRequest {
  verification_code: string;
}

export interface ConfirmAccountResponse {
  success: boolean;
  message: string;
  is_verified?: boolean;
  phone_verified?: boolean;
  error?: string;
  attempts_remaining?: number;
}

export const useSMSVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const sendVerificationCode = useCallback(async (data: SMSVerificationRequest): Promise<SMSVerificationResponse> => {
    setIsSendingCode(true);
    try {
      // Normalize phone number
      const phoneInfo = normalizePhoneNumber(data.phone_number);
      if (!phoneInfo.isValid) {
        toast({
          title: "Invalid Phone Number",
          description: phoneInfo.error || "Please enter a valid phone number",
          variant: "destructive",
        });
        return {
          success: false,
          error: phoneInfo.error,
        };
      }

      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Convert to backend format
      const backendFormat = toBackendPhoneFormat(phoneInfo.normalized);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.SEND_CODE}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...data,
          phone_number: backendFormat
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Verification Code Sent",
          description: `Code sent to ${phoneInfo.formatted}`,
        });
        return result;
      } else {
        // Handle specific error cases
        let errorMessage = result.error || "Failed to send verification code";
        
        if (response.status === 429) {
          errorMessage = "Too many requests. Please wait before requesting another code.";
        } else if (response.status === 400) {
          errorMessage = "Invalid phone number or request format.";
        } else if (response.status === 500) {
          errorMessage = "SMS service temporarily unavailable. Please try again later.";
        }

        toast({
          title: "Failed to Send Code",
          description: errorMessage,
          variant: "destructive",
        });
        return {
          success: false,
          error: errorMessage,
          attempts_remaining: result.attempts_remaining,
          locked_until: result.locked_until,
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || "Network error occurred";
      toast({
        title: "Network Error",
        description: `Failed to send verification code: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSendingCode(false);
    }
  }, [toast]);

  const verifyCode = useCallback(async (data: VerifyCodeRequest): Promise<VerifyCodeResponse> => {
    setIsVerifying(true);
    try {
      // Normalize phone number
      const phoneInfo = normalizePhoneNumber(data.phone_number);
      if (!phoneInfo.isValid) {
        toast({
          title: "Invalid Phone Number",
          description: phoneInfo.error || "Please enter a valid phone number",
          variant: "destructive",
        });
        return {
          success: false,
          error: phoneInfo.error,
        };
      }

      // Validate verification code format
      if (!data.verification_code || data.verification_code.length !== 6 || !/^\d{6}$/.test(data.verification_code)) {
        toast({
          title: "Invalid Code Format",
          description: "Please enter a 6-digit verification code",
          variant: "destructive",
        });
        return {
          success: false,
          error: "Invalid verification code format",
        };
      }

      // Convert to backend format
      const backendFormat = toBackendPhoneFormat(phoneInfo.normalized);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.VERIFY_CODE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          phone_number: backendFormat
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Verification Successful",
          description: result.message || "Phone number verified successfully",
        });
        return result;
      } else {
        // Handle specific error cases
        let errorMessage = result.error || "Invalid verification code";
        
        if (response.status === 400) {
          if (result.error?.includes('expired')) {
            errorMessage = "Verification code has expired. Please request a new one.";
          } else if (result.error?.includes('invalid')) {
            errorMessage = "Invalid verification code. Please check and try again.";
          } else {
            errorMessage = "Invalid request. Please try again.";
          }
        } else if (response.status === 429) {
          errorMessage = "Too many failed attempts. Please wait before trying again.";
        } else if (response.status === 404) {
          errorMessage = "No verification code found. Please request a new one.";
        }

        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return {
          success: false,
          error: errorMessage,
          attempts_remaining: result.attempts_remaining,
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || "Network error occurred";
      toast({
        title: "Network Error",
        description: `Failed to verify code: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsVerifying(false);
    }
  }, [toast]);

  const requestPasswordReset = useCallback(async (data: ForgotPasswordRequest): Promise<SMSVerificationResponse> => {
    setIsLoading(true);
    try {
      // Normalize phone number
      const phoneInfo = normalizePhoneNumber(data.phone_number);
      if (!phoneInfo.isValid) {
        toast({
          title: "Invalid Phone Number",
          description: phoneInfo.error || "Please enter a valid phone number",
          variant: "destructive",
        });
        return {
          success: false,
          error: phoneInfo.error,
        };
      }

      // Convert to backend format
      const backendFormat = toBackendPhoneFormat(phoneInfo.normalized);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.FORGOT_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          phone_number: backendFormat
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Password Reset Code Sent",
          description: `Reset code sent to ${phoneInfo.formatted}`,
        });
        return result;
      } else {
        // Handle specific error cases
        let errorMessage = result.error || "Failed to send password reset code";
        
        if (response.status === 404) {
          errorMessage = "No account found with this phone number.";
        } else if (response.status === 429) {
          errorMessage = "Too many requests. Please wait before requesting another code.";
        } else if (response.status === 400) {
          errorMessage = "Invalid phone number format.";
        }

        toast({
          title: "Failed to Send Reset Code",
          description: errorMessage,
          variant: "destructive",
        });
        return {
          success: false,
          error: errorMessage,
          attempts_remaining: result.attempts_remaining,
          locked_until: result.locked_until,
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || "Network error occurred";
      toast({
        title: "Network Error",
        description: `Failed to request password reset: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const resetPassword = useCallback(async (data: ResetPasswordRequest): Promise<{ success: boolean; message?: string; error?: string }> => {
    setIsLoading(true);
    try {
      // Normalize phone number
      const phoneInfo = normalizePhoneNumber(data.phone_number);
      if (!phoneInfo.isValid) {
        toast({
          title: "Invalid Phone Number",
          description: phoneInfo.error || "Please enter a valid phone number",
          variant: "destructive",
        });
        return {
          success: false,
          error: phoneInfo.error,
        };
      }

      // Validate password requirements
      if (data.new_password.length < 8) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 8 characters long",
          variant: "destructive",
        });
        return {
          success: false,
          error: "Password must be at least 8 characters long",
        };
      }

      if (data.new_password !== data.new_password_confirm) {
        toast({
          title: "Passwords Don't Match",
          description: "New password and confirmation must match",
          variant: "destructive",
        });
        return {
          success: false,
          error: "Passwords don't match",
        };
      }

      // Convert to backend format
      const backendFormat = toBackendPhoneFormat(phoneInfo.normalized);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.RESET_PASSWORD}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          phone_number: backendFormat
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Password Reset Successful",
          description: result.message || "Password reset successfully. You can now login with your new password.",
        });
        return result;
      } else {
        // Handle specific error cases
        let errorMessage = result.error || "Failed to reset password";
        
        if (response.status === 400) {
          if (result.error?.includes('verification code')) {
            errorMessage = "Invalid or expired verification code. Please request a new one.";
          } else if (result.error?.includes('password')) {
            errorMessage = "Password does not meet requirements.";
          } else {
            errorMessage = "Invalid request. Please check your information.";
          }
        } else if (response.status === 404) {
          errorMessage = "No account found with this phone number.";
        } else if (response.status === 429) {
          errorMessage = "Too many attempts. Please wait before trying again.";
        }

        toast({
          title: "Password Reset Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      const errorMessage = error.message || "Network error occurred";
      toast({
        title: "Network Error",
        description: `Failed to reset password: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const confirmAccount = useCallback(async (data: ConfirmAccountRequest): Promise<ConfirmAccountResponse> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.CONFIRM_ACCOUNT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Account Confirmed",
          description: result.message || "Account confirmed successfully",
        });
        return result;
      } else {
        toast({
          title: "Account Confirmation Failed",
          description: result.error || "Failed to confirm account",
          variant: "destructive",
        });
        return result;
      }
    } catch (error: any) {
      const errorMessage = error.message || "Network error occurred";
      toast({
        title: "Network Error",
        description: `Failed to confirm account: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    isSendingCode,
    isVerifying,
    sendVerificationCode,
    verifyCode,
    requestPasswordReset,
    resetPassword,
    confirmAccount,
  };
};

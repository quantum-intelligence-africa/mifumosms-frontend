import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/config/api';
import { normalizePhoneNumber } from '@/utils/phoneUtils';

export interface SendVerificationLinkRequest {
  phone_number: string;
}

export interface SendVerificationLinkResponse {
  success: boolean;
  message: string;
  phone_number?: string;
  verification_link?: string;
  bypassed?: boolean;
  error?: string;
}

export interface VerifyAccountLinkRequest {
  token: string;
  phone_number: string;
}

export interface VerifyAccountLinkResponse {
  success: boolean;
  message: string;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_verified: boolean;
    phone_verified: boolean;
  };
  error?: string;
}

export interface ResendVerificationLinkRequest {
  phone_number: string;
}

export interface ResendVerificationLinkResponse {
  success: boolean;
  message: string;
  phone_number?: string;
  verification_link?: string;
  bypassed?: boolean;
  error?: string;
}

export const useVerificationLink = () => {
  const { toast } = useToast();
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [isResendingLink, setIsResendingLink] = useState(false);

  const sendVerificationLink = useCallback(async (data: SendVerificationLinkRequest): Promise<SendVerificationLinkResponse> => {
    setIsSendingLink(true);
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

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.SEND_VERIFICATION_LINK}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          phone_number: phoneInfo.normalized
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.bypassed) {
          toast({
            title: "Verification Bypassed",
            description: "Account verification not required for admin users",
          });
        } else {
          toast({
            title: "Verification Link Sent",
            description: `Verification link sent to ${phoneInfo.formatted}`,
          });
        }
        return result;
      } else {
        // Handle specific error cases
        let errorMessage = result.error || "Failed to send verification link";
        
        if (response.status === 404) {
          errorMessage = "No account found with this phone number.";
        } else if (response.status === 429) {
          errorMessage = "Too many requests. Please wait before requesting another link.";
        } else if (response.status === 400) {
          errorMessage = "Invalid phone number format.";
        }

        toast({
          title: "Failed to Send Link",
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
        description: `Failed to send verification link: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsSendingLink(false);
    }
  }, [toast]);

  const verifyAccountLink = useCallback(async (data: VerifyAccountLinkRequest): Promise<VerifyAccountLinkResponse> => {
    setIsVerifyingLink(true);
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

      // Validate token format
      if (!data.token || data.token.length < 10) {
        toast({
          title: "Invalid Token",
          description: "Please enter a valid verification token",
          variant: "destructive",
        });
        return {
          success: false,
          error: "Invalid verification token format",
        };
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.VERIFY_ACCOUNT_LINK}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          phone_number: phoneInfo.normalized
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Account Verified",
          description: result.message || "Account verified successfully",
        });
        return result;
      } else {
        // Handle specific error cases
        let errorMessage = result.error || "Verification failed";
        
        if (response.status === 400) {
          if (result.error?.includes('expired')) {
            errorMessage = "Verification link has expired. Please request a new one.";
          } else if (result.error?.includes('invalid')) {
            errorMessage = "Invalid verification link or phone number.";
          } else {
            errorMessage = "Invalid request. Please try again.";
          }
        } else if (response.status === 404) {
          errorMessage = "No account found with this phone number.";
        } else if (response.status === 429) {
          errorMessage = "Too many attempts. Please wait before trying again.";
        }

        toast({
          title: "Verification Failed",
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
        description: `Failed to verify account: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsVerifyingLink(false);
    }
  }, [toast]);

  const resendVerificationLink = useCallback(async (data: ResendVerificationLinkRequest): Promise<ResendVerificationLinkResponse> => {
    setIsResendingLink(true);
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

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SMS.RESEND_VERIFICATION_LINK}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          phone_number: phoneInfo.normalized
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (result.bypassed) {
          toast({
            title: "Verification Bypassed",
            description: "Account verification not required for admin users",
          });
        } else if (result.message === 'Account is already verified') {
          toast({
            title: "Already Verified",
            description: "Account is already verified. Redirecting to dashboard...",
          });
        } else {
          toast({
            title: "New Link Sent",
            description: `New verification link sent to ${phoneInfo.formatted}`,
          });
        }
        return result;
      } else {
        // Handle specific error cases
        let errorMessage = result.error || "Failed to resend verification link";
        
        if (response.status === 404) {
          errorMessage = "No account found with this phone number.";
        } else if (response.status === 429) {
          errorMessage = "Too many requests. Please wait before requesting another link.";
        } else if (response.status === 400) {
          errorMessage = "Invalid phone number format.";
        }

        toast({
          title: "Failed to Resend Link",
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
        description: `Failed to resend verification link: ${errorMessage}`,
        variant: "destructive",
      });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsResendingLink(false);
    }
  }, [toast]);

  return {
    sendVerificationLink,
    verifyAccountLink,
    resendVerificationLink,
    isSendingLink,
    isVerifyingLink,
    isResendingLink,
  };
};

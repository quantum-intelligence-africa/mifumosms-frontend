import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface KYCDocument {
	id?: number;
	file: string;
	uploaded_at: string;
}

export interface SenderRequestResponse {
	id: string;
	requested_sender_id: string;
	sample_content: string;
	status: 'awaiting_payment' | 'completed' | 'rejected' | 'pending';
	kyc_documents: KYCDocument[];
	payment?: {
		id: string;
		status: string;
		amount: number;
		currency: string;
	};
}

export interface KYCUploadParams {
	requested_sender_id: string;
	sample_content: string;
	phone_number?: string;
	kyc_files: File[];
}

export const useKYCUpload = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [response, setResponse] = useState<SenderRequestResponse | null>(null);
	const { toast } = useToast();

	const uploadKYC = useCallback(async (params: KYCUploadParams) => {
		try {
			setIsLoading(true);
			setError(null);

			// Create FormData for multipart upload
			const formData = new FormData();
			formData.append('requested_sender_id', params.requested_sender_id);
			formData.append('sample_content', params.sample_content);

			if (params.phone_number) {
				formData.append('phone_number', params.phone_number);
			}

			// Append each KYC document
			params.kyc_files.forEach((file) => {
				formData.append('kyc_documents', file);
			});

			// Make API request
			const apiResponse = await fetch(
				`${import.meta.env.VITE_API_BASE_URL || 'https://mifumosms.mifumolabs.com'}/api/messaging/sender-requests/`,
				{
					method: 'POST',
					headers: {
						'Authorization': `Token ${localStorage.getItem('auth_token') || ''}`,
					},
					body: formData,
				}
			);

			if (!apiResponse.ok) {
				const error = await apiResponse.json();
				throw new Error(error.detail || error.message || 'Failed to upload KYC documents');
			}

			const data = await apiResponse.json();
			setResponse(data.data || data);

			toast({
				title: 'Success',
				description: 'KYC documents uploaded successfully',
			});

			return data.data || data;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
			setError(errorMessage);
			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			});
			return null;
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	const reset = useCallback(() => {
		setError(null);
		setResponse(null);
	}, []);

	return {
		uploadKYC,
		isLoading,
		error,
		response,
		reset,
	};
};

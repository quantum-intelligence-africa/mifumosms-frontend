import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from './use-toast';

interface PartinResponse {
	success: boolean;
	message: string;
}

export const usePartinaRequest = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();

	const submitPartinaRequest = async (reason: string) => {
		if (!reason || reason.trim().length === 0) {
			const errorMsg = 'Please provide a reason for your request.';
			setError(errorMsg);
			toast({
				title: 'Error',
				description: errorMsg,
				variant: 'destructive'
			});
			return { success: false, message: errorMsg };
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await apiClient.requestPartina(reason.trim());

			if (response.success) {
				const successMsg = response.data?.message || 'Your request to become a Partina has been submitted!';
				toast({
					title: 'Success',
					description: successMsg
				});
				return { success: true, message: successMsg };
			} else {
				const errorMsg = response.data?.message || response.error || 'Failed to submit request';
				setError(errorMsg);
				toast({
					title: 'Error',
					description: errorMsg,
					variant: 'destructive'
				});
				return { success: false, message: errorMsg };
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'An error occurred while submitting your request';
			setError(errorMsg);
			toast({
				title: 'Error',
				description: errorMsg,
				variant: 'destructive'
			});
			return { success: false, message: errorMsg };
		} finally {
			setIsLoading(false);
		}
	};

	return {
		submitPartinaRequest,
		isLoading,
		error,
		setError
	};
};

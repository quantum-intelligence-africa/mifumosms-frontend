import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface PurchaseRecord {
	id: string;
	invoice_number: string;
	package_name: string;
	credits: number;
	amount: number;
	unit_price: number;
	payment_method: string;
	status: string;
	created_at: string;
	completed_at: string | null;
}

export interface PurchaseHistoryResponse {
	purchases: PurchaseRecord[];
	pagination: {
		page: number;
		page_size: number;
		total_count: number;
		total_pages: number;
		has_next: boolean;
		has_previous: boolean;
	};
}

export interface PurchaseHistoryFilters {
	status?: string;
	start_date?: string;
	end_date?: string;
	page?: number;
	page_size?: number;
}

export const usePurchaseHistory = () => {
	const [data, setData] = useState<PurchaseHistoryResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();

	const fetchPurchaseHistory = useCallback(async (filters: PurchaseHistoryFilters = {}) => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await apiClient.getSMSPurchaseHistory({
				status: filters.status,
				start_date: filters.start_date,
				end_date: filters.end_date,
				page: filters.page || 1,
				page_size: filters.page_size || 20
			});

			if (response.success && response.data) {
				setData(response.data);
				return response.data;
			} else {
				const errorMessage = response.error || 'Failed to fetch purchase history';
				setError(errorMessage);
				toast({
					title: 'Error',
					description: errorMessage,
					variant: 'destructive'
				});
				return null;
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
			setError(errorMessage);
			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive'
			});
			return null;
		} finally {
			setIsLoading(false);
		}
	}, [toast]);

	const goToPage = useCallback((page: number, filters: PurchaseHistoryFilters = {}) => {
		return fetchPurchaseHistory({
			...filters,
			page
		});
	}, [fetchPurchaseHistory]);

	const changePageSize = useCallback((pageSize: number, filters: PurchaseHistoryFilters = {}) => {
		return fetchPurchaseHistory({
			...filters,
			page_size: pageSize,
			page: 1 // Reset to first page when changing page size
		});
	}, [fetchPurchaseHistory]);

	const refresh = useCallback((filters: PurchaseHistoryFilters = {}) => {
		return fetchPurchaseHistory(filters);
	}, [fetchPurchaseHistory]);

	return {
		data,
		purchases: data?.purchases || [],
		pagination: data?.pagination || null,
		isLoading,
		error,
		fetchPurchaseHistory,
		goToPage,
		changePageSize,
		refresh
	};
};

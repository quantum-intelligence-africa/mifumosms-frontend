import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
	Template,
	TemplateListResponse,
	TemplateFilterParams,
	CreateTemplateRequest,
	TemplateUpdateRequest
} from '@/lib/api';

export const useTemplates = (initialFilters?: TemplateFilterParams) => {
	const [templates, setTemplates] = useState<Template[]>([]);
	const [filterOptions, setFilterOptions] = useState<any>(null);
	const [totalCount, setTotalCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [filters, setFilters] = useState<TemplateFilterParams>(initialFilters || {});
	const { toast } = useToast();

	const fetchTemplates = async (newFilters?: TemplateFilterParams) => {
		// Prevent multiple simultaneous calls
		if (isLoading) {
			console.log('Templates fetch already in progress, skipping...');
			return;
		}

		setIsLoading(true);
		console.log('Starting templates fetch...');

		// Set a timeout to prevent infinite loading
		const timeoutId = setTimeout(() => {
			console.log('Templates fetch timeout reached');
			setTemplates([]);
			setFilterOptions(null);
			setTotalCount(0);
			setIsLoading(false);
			setHasLoaded(true);
			toast({
				title: "Connection Timeout",
				description: "Unable to load templates. Please check your connection and try again.",
				variant: "destructive"
			});
		}, 15000); // 15 second timeout

		try {
			const currentFilters = newFilters || filters;
			console.log('Fetching templates with filters:', currentFilters);
			console.log('API endpoint:', '/messaging/templates/');

			const response = await apiClient.getTemplates(currentFilters);

			// Clear timeout since we got a response
			clearTimeout(timeoutId);
			console.log('Templates API response:', response);

			if (response.success && response.data) {
				const templates = response.data.templates || [];
				const filterOptions = response.data.filter_options;
				const totalCount = response.data.total_count || 0;

				console.log('Templates loaded successfully:', templates.length, 'templates');
				console.log('Filter options:', filterOptions);
				console.log('Total count:', totalCount);

				setTemplates(templates);
				setFilterOptions(filterOptions);
				setTotalCount(totalCount);
			} else {
				// Even on error, set empty arrays so UI can show empty state
				console.error('Templates API error:', response.error);
				console.error('Response status:', response.status);
				console.error('Full response:', response);

				setTemplates([]);
				setFilterOptions(null);
				setTotalCount(0);

				// Show specific error message
				const errorMessage = response.error ||
					response.message ||
					`API Error (${response.status})` ||
					"Failed to fetch templates";

				toast({
					title: "Error Loading Templates",
					description: errorMessage,
					variant: "destructive"
				});
			}
		} catch (error) {
			// Clear timeout since we got an error
			clearTimeout(timeoutId);

			// Even on error, set empty arrays so UI can show empty state
			console.error('Templates fetch error:', error);
			console.error('Error type:', typeof error);
			console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');

			setTemplates([]);
			setFilterOptions(null);
			setTotalCount(0);

			// Show specific error message
			const errorMessage = error instanceof Error ? error.message : 'Network error occurred';

			toast({
				title: "Network Error",
				description: `Failed to fetch templates: ${errorMessage}`,
				variant: "destructive"
			});
		} finally {
			console.log('Templates fetch completed, setting loading to false');
			setIsLoading(false);
			setHasLoaded(true);
		}
	};

	const createTemplate = async (data: CreateTemplateRequest) => {
		setIsCreating(true);
		try {
			const response = await apiClient.createTemplate(data);

			if (response.success && response.data) {
				toast({
					title: "Success",
					description: "Template created successfully"
				});
				// Refresh templates list
				await fetchTemplates();
				return { success: true, data: response.data };
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to create template",
					variant: "destructive"
				});
				return { success: false, error: response.error };
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to create template",
				variant: "destructive"
			});
			return { success: false, error: "Network error" };
		} finally {
			setIsCreating(false);
		}
	};

	const updateTemplate = async (templateId: string, data: TemplateUpdateRequest) => {
		setIsUpdating(true);
		try {
			const response = await apiClient.updateTemplate(templateId, data);

			if (response.success && response.data) {
				toast({
					title: "Success",
					description: "Template updated successfully"
				});
				// Update local state
				setTemplates(prev => prev.map(t => t.id === templateId ? response.data : t));
				return { success: true, data: response.data };
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to update template",
					variant: "destructive"
				});
				return { success: false, error: response.error };
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to update template",
				variant: "destructive"
			});
			return { success: false, error: "Network error" };
		} finally {
			setIsUpdating(false);
		}
	};

	const deleteTemplate = async (templateId: string) => {
		setIsDeleting(true);
		try {
			const response = await apiClient.deleteTemplate(templateId);

			if (response.success) {
				toast({
					title: "Success",
					description: "Template deleted successfully"
				});
				// Remove from local state
				setTemplates(prev => prev.filter(t => t.id !== templateId));
				setTotalCount(prev => prev - 1);
				return { success: true };
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to delete template",
					variant: "destructive"
				});
				return { success: false, error: response.error };
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to delete template",
				variant: "destructive"
			});
			return { success: false, error: "Network error" };
		} finally {
			setIsDeleting(false);
		}
	};

	const toggleFavorite = async (templateId: string) => {
		try {
			const response = await apiClient.toggleTemplateFavorite(templateId);

			if (response.success && response.data) {
				// Update local state
				setTemplates(prev => prev.map(t =>
					t.id === templateId
						? { ...t, is_favorite: response.data.is_favorite }
						: t
				));
				return { success: true, is_favorite: response.data.is_favorite };
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to toggle favorite",
					variant: "destructive"
				});
				return { success: false, error: response.error };
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to toggle favorite",
				variant: "destructive"
			});
			return { success: false, error: "Network error" };
		}
	};

	const incrementUsage = async (templateId: string) => {
		try {
			const response = await apiClient.incrementTemplateUsage(templateId);

			if (response.success && response.data) {
				// Update local state
				setTemplates(prev => prev.map(t =>
					t.id === templateId
						? { ...t, usage_count: response.data.usage_count }
						: t
				));
				return { success: true, usage_count: response.data.usage_count };
			} else {
				return { success: false, error: response.error };
			}
		} catch (error) {
			return { success: false, error: "Network error" };
		}
	};

	const approveTemplate = async (templateId: string) => {
		try {
			const response = await apiClient.approveTemplate(templateId);

			if (response.success && response.data) {
				toast({
					title: "Success",
					description: "Template approved successfully"
				});
				// Update local state
				setTemplates(prev => prev.map(t =>
					t.id === templateId
						? { ...t, status: 'approved', approved: true, approval_status: 'approved' }
						: t
				));
				return { success: true };
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to approve template",
					variant: "destructive"
				});
				return { success: false, error: response.error };
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to approve template",
				variant: "destructive"
			});
			return { success: false, error: "Network error" };
		}
	};

	const rejectTemplate = async (templateId: string) => {
		try {
			const response = await apiClient.rejectTemplate(templateId);

			if (response.success && response.data) {
				toast({
					title: "Success",
					description: "Template rejected successfully"
				});
				// Update local state
				setTemplates(prev => prev.map(t =>
					t.id === templateId
						? { ...t, status: 'rejected', approved: false, approval_status: 'rejected' }
						: t
				));
				return { success: true };
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to reject template",
					variant: "destructive"
				});
				return { success: false, error: response.error };
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to reject template",
				variant: "destructive"
			});
			return { success: false, error: "Network error" };
		}
	};

	const copyTemplate = async (templateId: string, newName?: string) => {
		try {
			const response = await apiClient.copyTemplate(templateId, newName);

			if (response.success && response.data) {
				toast({
					title: "Success",
					description: "Template copied successfully"
				});
				// Add to local state
				setTemplates(prev => [response.data, ...prev]);
				setTotalCount(prev => prev + 1);
				return { success: true, data: response.data };
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to copy template",
					variant: "destructive"
				});
				return { success: false, error: response.error };
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to copy template",
				variant: "destructive"
			});
			return { success: false, error: "Network error" };
		}
	};

	const updateFilters = (newFilters: TemplateFilterParams) => {
		setFilters(newFilters);
		fetchTemplates(newFilters);
	};

	useEffect(() => {
		// Only fetch if we haven't loaded yet
		if (!hasLoaded) {
			fetchTemplates();
		}
	}, [hasLoaded]);

	return {
		templates,
		filterOptions,
		totalCount,
		isLoading,
		isCreating,
		isUpdating,
		isDeleting,
		filters,
		fetchTemplates,
		createTemplate,
		updateTemplate,
		deleteTemplate,
		toggleFavorite,
		incrementUsage,
		approveTemplate,
		rejectTemplate,
		copyTemplate,
		updateFilters
	};
};

export const useTemplate = (templateId: string) => {
	const [template, setTemplate] = useState<Template | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [variables, setVariables] = useState<string[]>([]);
	const { toast } = useToast();

	const fetchTemplate = async () => {
		if (!templateId) return;

		setIsLoading(true);
		try {
			const response = await apiClient.getTemplate(templateId);

			if (response.success && response.data) {
				setTemplate(response.data);
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to fetch template",
					variant: "destructive"
				});
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch template",
				variant: "destructive"
			});
		} finally {
			setIsLoading(false);
		}
	};

	const fetchVariables = async () => {
		if (!templateId) return;

		try {
			const response = await apiClient.getTemplateVariables(templateId);

			if (response.success && response.data) {
				setVariables(response.data.variables);
			}
		} catch (error) {
			console.error('Failed to fetch template variables:', error);
		}
	};

	useEffect(() => {
		fetchTemplate();
		fetchVariables();
	}, [templateId]);

	return {
		template,
		variables,
		isLoading,
		fetchTemplate,
		fetchVariables
	};
};

export const useTemplateStatistics = () => {
	const [statistics, setStatistics] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();

	const fetchStatistics = async () => {
		setIsLoading(true);
		try {
			const response = await apiClient.getTemplateStatistics();

			if (response.success && response.data) {
				setStatistics(response.data);
			} else {
				toast({
					title: "Error",
					description: response.error || "Failed to fetch template statistics",
					variant: "destructive"
				});
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch template statistics",
				variant: "destructive"
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchStatistics();
	}, []);

	return {
		statistics,
		isLoading,
		fetchStatistics
	};
};

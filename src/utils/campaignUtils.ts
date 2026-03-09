/**
 * Campaign Management Utilities
 *
 * Provides functionality for campaign cost calculation, credit estimation,
 * recurring schedule validation, and SMS segmentation.
 */

/**
 * Calculate number of SMS segments required for a message
 * @param message - Message text
 * @returns Number of SMS segments (160 chars per segment)
 */
export function calculateSMSSegments(message: string): number {
	if (!message || message.length === 0) return 0;
	return Math.ceil(message.length / 160);
}

/**
 * Calculate estimated SMS credits needed for a campaign
 * @param messageText - Campaign message content
 * @param recipientCount - Number of recipients
 * @param costPerSegment - Cost per SMS segment in credits (default: 25 TZS)
 * @returns Total estimated cost in credits/TZS
 */
export function calculateCampaignCost(
	messageText: string,
	recipientCount: number,
	costPerSegment: number = 25
): number {
	const segments = calculateSMSSegments(messageText);
	return segments * recipientCount * costPerSegment;
}

/**
 * Calculate weekly credit deduction for recurring campaigns
 * @param messageText - Campaign message content
 * @param recipientCount - Number of recipients
 * @param scheduleType - 'single', 'daily', 'weekly', or 'monthly'
 * @param daysPerWeek - Number of days per week (for weekly schedules)
 * @param costPerSegment - Cost per segment (default: 25)
 * @returns Weekly credit cost
 */
export function calculateRecurringWeeklyCost(
	messageText: string,
	recipientCount: number,
	scheduleType: 'single' | 'daily' | 'weekly' | 'monthly',
	daysPerWeek: number = 1,
	costPerSegment: number = 25
): number {
	const segments = calculateSMSSegments(messageText);
	const costsPerExecution = segments * recipientCount * costPerSegment;

	switch (scheduleType) {
		case 'single':
			// One-time in a week
			return costsPerExecution;
		case 'daily':
			return costsPerExecution * 7; // 7 days per week
		case 'weekly':
			return costsPerExecution * daysPerWeek; // specific days per week
		case 'monthly':
			return costsPerExecution * (30 / 7); // approximate monthly to weekly
		default:
			return costsPerExecution;
	}
}

/**
 * Validate recurring schedule configuration
 * @param schedule - Recurring schedule object with type, time, days, day_of_month, and end_date properties
 * @returns Validation result with error messages
 */
export function validateRecurringSchedule(schedule: {
	type?: string;
	time?: string;
	days?: string[];
	day_of_month?: number;
	end_date?: string;
}): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!schedule.type) {
		errors.push('Schedule type is required');
	} else if (!['single', 'daily', 'weekly', 'monthly'].includes(schedule.type)) {
		errors.push('Schedule type must be single, daily, weekly, or monthly');
	}

	if (!schedule.time) {
		errors.push('Execution time is required');
	} else if (!/^\d{2}:\d{2}$/.test(schedule.time)) {
		errors.push('Time must be in HH:MM format (24-hour)');
	}

	if (schedule.type === 'weekly') {
		if (!schedule.days || !Array.isArray(schedule.days) || schedule.days.length === 0) {
			errors.push('At least one day must be selected for weekly schedules');
		}
		const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
		const invalidDays = (schedule.days || []).filter((day: string) => !validDays.includes(day.toLowerCase()));
		if (invalidDays.length > 0) {
			errors.push(`Invalid day names: ${invalidDays.join(', ')}`);
		}
	}

	if (schedule.type === 'monthly') {
		if (schedule.day_of_month !== undefined) {
			const day = Number(schedule.day_of_month);
			if (isNaN(day) || day < 1 || day > 31) {
				errors.push('Day of month must be between 1 and 31');
			}
		}
	}

	if (schedule.end_date) {
		const endDate = new Date(schedule.end_date);
		if (isNaN(endDate.getTime())) {
			errors.push('Invalid end date format');
		} else if (endDate < new Date()) {
			errors.push('End date must be in the future');
		}
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

/**
 * Format schedule for display
 * @param schedule - Recurring schedule object with type, time, days, day_of_month, and end_date properties
 * @returns Human-readable schedule description
 */
export function formatScheduleDescription(schedule: {
	type?: string;
	time?: string;
	days?: string[];
	day_of_month?: number;
	end_date?: string;
}): string {
	if (!schedule || !schedule.type) return 'No schedule';

	let description = '';

	switch (schedule.type) {
		case 'single':
			description = `One-time at ${schedule.time || '09:00'}`;
			if (schedule.end_date) {
				description += ` on ${new Date(schedule.end_date).toLocaleDateString()}`;
			}
			break;

		case 'daily':
			description = `Daily at ${schedule.time || '09:00'}`;
			if (schedule.end_date) {
				description += ` until ${new Date(schedule.end_date).toLocaleDateString()}`;
			}
			break;

		case 'weekly': {
			const days = (schedule.days || [])
				.map((day: string) => day.charAt(0).toUpperCase() + day.slice(1))
				.join(', ');
			description = `Every ${days} at ${schedule.time || '09:00'}`;
			if (schedule.end_date) {
				description += ` until ${new Date(schedule.end_date).toLocaleDateString()}`;
			}
			break;
		}

		case 'monthly': {
			const dayOfMonth = schedule.day_of_month || 1;
			const suffix = dayOfMonth % 10 === 1 && dayOfMonth !== 11 ? 'st' :
				dayOfMonth % 10 === 2 && dayOfMonth !== 12 ? 'nd' :
					dayOfMonth % 10 === 3 && dayOfMonth !== 13 ? 'rd' : 'th';
			description = `On the ${dayOfMonth}${suffix} of every month at ${schedule.time || '09:00'}`;
			if (schedule.end_date) {
				description += ` until ${new Date(schedule.end_date).toLocaleDateString()}`;
			}
			break;
		}
	}

	return description;
}

/**
 * Get campaign status badge color
 * @param status - Campaign status
 * @returns Tailwind color class
 */
export function getStatusColorClass(status: string): string {
	const statusMap: Record<string, string> = {
		draft: 'bg-gray-100 text-gray-700 border-gray-300',
		scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
		running: 'bg-green-100 text-green-700 border-green-300',
		paused: 'bg-yellow-100 text-yellow-700 border-yellow-300',
		completed: 'bg-green-100 text-green-700 border-green-300',
		cancelled: 'bg-red-100 text-red-700 border-red-300',
		failed: 'bg-red-100 text-red-700 border-red-300'
	};
	return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
}

/**
 * Format campaign cost for display
 * @param cost - Cost amount in TZS
 * @returns Formatted cost string
 */
export function formatCampaignCost(cost: number): string {
	return `TZS ${Math.round(cost).toLocaleString()}`;
}

/**
 * Estimate campaign summary
 * @param messageText - Campaign message
 * @param recipientCount - Number of recipients
 * @param isRecurring - Whether campaign is recurring
 * @param scheduleType - Type of schedule (for recurring)
 * @param daysPerWeek - Days per week for weekly schedules
 * @returns Campaign summary object
 */
export function estimateCampaignSummary(
	messageText: string,
	recipientCount: number,
	isRecurring: boolean = false,
	scheduleType: 'single' | 'daily' | 'weekly' | 'monthly' = 'daily',
	daysPerWeek: number = 1
): {
	segments: number;
	costPerExecution: number;
	totalRecipients: number;
	isRecurring: boolean;
	weeklyCost?: number;
	estimatedMonthlyRecipients?: number;
} {
	const segments = calculateSMSSegments(messageText);
	const costPerExecution = segments * recipientCount * 25;

	const result: {
		segments: number;
		costPerExecution: number;
		totalRecipients: number;
		isRecurring: boolean;
		weeklyCost?: number;
		estimatedMonthlyRecipients?: number;
	} = {
		segments,
		costPerExecution,
		totalRecipients: recipientCount,
		isRecurring
	};

	if (isRecurring) {
		result.weeklyCost = calculateRecurringWeeklyCost(
			messageText,
			recipientCount,
			scheduleType,
			daysPerWeek
		);
		result.estimatedMonthlyRecipients = recipientCount * (daysPerWeek / 7 * 30);
	}

	return result;
}

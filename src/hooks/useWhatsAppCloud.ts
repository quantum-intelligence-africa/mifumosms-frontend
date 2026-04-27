import { useState } from "react";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WASendSinglePayload {
	to: string;
	type?: "text" | "template";
	text?: string;
	template_name?: string;
	language_code?: string;
	components?: unknown[];
}

export interface WASendBulkPayload {
	recipients: string[];
	text: string;
	delay_ms?: number;
}

export interface WASendByCategoryPayload {
	category: "active subscribers" | "expiring soon" | "inactive paid users";
	text: string;
	days?: number;
	delay_ms?: number;
}

export interface WASendByUserIdsPayload {
	text: string;
	user_ids?: string[];
	phone_numbers?: string[];
}

export interface WASendByDateRangePayload {
	text: string;
	start_date?: string;
	end_date?: string;
	delay_ms?: number;
}

export type WAGetUsersType = "all" | "by_category" | "by_user_ids" | "by_date_range";

export interface WAGetUsersParams {
	type?: WAGetUsersType;
	category?: string;
	user_ids?: string;
	start_date?: string;
	end_date?: string;
	days?: number;
	page?: number;
	page_size?: number;
	tenant_id?: string;
}

export interface WAUser {
	user_id: string;
	phone_number: string;
	name: string;
	email: string;
	is_active: boolean;
	tags: string[];
}

export interface WAGetUsersResponse {
	query_type: string;
	count: number;
	users: WAUser[];
	total?: number;
	page?: number;
	page_size?: number;
	has_next?: boolean;
	has_previous?: boolean;
}

export interface WASendSingleResult {
	whatsapp_account_id: string;
	to: string;
	ok: boolean;
	http_status: number;
	message_id?: string;
	error?: string;
	data?: unknown;
}

export interface WASendBulkResult {
	whatsapp_account_id: string;
	total: number;
	sent: number;
	failed: number;
	results: Array<{
		to: string;
		ok: boolean;
		http_status: number;
		message_id?: string;
		error?: string;
		data?: unknown;
	}>;
}

export interface WAMessageTemplate {
	id: string;
	name: string;
	status: "APPROVED" | "PENDING_REVIEW" | "REJECTED" | "DISABLED";
	category?: string;
	language?: string;
	components?: unknown[];
}

export interface WAGetTemplatesResponse {
	success: boolean;
	data: {
		whatsapp_account_id: string;
		whatsapp_business_account_id: string;
		ok: boolean;
		http_status: number;
		graph: {
			data: WAMessageTemplate[];
			paging?: {
				cursors: {
					before?: string;
					after?: string;
				};
			};
		};
	};
}

export interface WACredentials {
	success: boolean;
	data: {
		chatbot_id: string;
		WHATSAPP_BUSINESS_ACCOUNT_ID: string;
		whatsapp_channel: {
			phone_number_id: string;
			whatsapp_business_account_id: string;
			access_token_configured: boolean;
			access_token_hint?: string;
			verify_token_configured: boolean;
			created_at?: string;
			updated_at?: string;
		} | null;
		meta_webhook_callback_url: string;
	};
}

export interface WASaveCredentialsPayload {
	phone_number_id?: string;
	WHATSAPP_PHONE_NUMBER_ID?: string;
	access_token?: string;
	WHATSAPP_ACCESS_TOKEN?: string;
	verify_token?: string;
	VERIFY_TOKEN?: string;
	WHATSAPP_VERIFY_TOKEN?: string;
	whatsapp_business_account_id?: string;
	WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

const getAuthHeaders = (): Record<string, string> => {
	const token = localStorage.getItem("access_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useWhatsAppCloud = () => {
	const [isLoading, setIsLoading] = useState(false);
	const { toast } = useToast();

	const WA = API_CONFIG.ENDPOINTS.MESSAGING.WHATSAPP_CLOUD;

	// ── POST helper ────────────────────────────────────────────────────────────
	const post = async <T>(url: string, body: unknown): Promise<T> => {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...getAuthHeaders() },
			body: JSON.stringify(body),
		});
		const json = await res.json();
		if (!json.success) {
			const msg = json.message || json.error || "Request failed";
			throw new Error(msg);
		}
		return json.data as T;
	};

	// ── GET helper ─────────────────────────────────────────────────────────────
	const get = async <T>(url: string): Promise<T> => {
		const res = await fetch(url, {
			headers: { Accept: "application/json", ...getAuthHeaders() },
		});
		const json = await res.json();
		if (json.success === false) {
			throw new Error(json.message || "Request failed");
		}
		return json as T;
	};

	// ── Send single ───────────────────────────────────────────────────────────
	const sendSingle = async (
		payload: WASendSinglePayload,
		waAccountId?: string
	): Promise<WASendSingleResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND(waAccountId))
				: buildApiUrl(WA.SEND_AUTO);

			const body = waAccountId
				? payload
				: { ...payload, whatsapp_account_id: waAccountId };

			const data = await post<WASendSingleResult>(url, body);
			toast({ title: "Message sent", description: `Delivered to ${data.to}` });
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Send failed";
			toast({ title: "Send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Send bulk ─────────────────────────────────────────────────────────────
	const sendBulk = async (
		payload: WASendBulkPayload,
		waAccountId?: string
	): Promise<WASendBulkResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND_BULK(waAccountId))
				: buildApiUrl(WA.SEND_BULK_AUTO);

			const body = waAccountId
				? payload
				: { ...payload, whatsapp_account_id: waAccountId };

			const data = await post<WASendBulkResult>(url, body);
			toast({
				title: "Bulk send complete",
				description: `${data.sent} sent, ${data.failed} failed out of ${data.total}`,
			});
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Bulk send failed";
			toast({ title: "Bulk send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Get users (with tenant support) ───────────────────────────────────────
	const getUsers = async (
		params: WAGetUsersParams,
		waAccountId?: string
	): Promise<WAGetUsersResponse> => {
		setIsLoading(true);
		try {
			const qs = new URLSearchParams();
			if (params.type) qs.set("type", params.type);
			if (params.category) qs.set("category", params.category);
			if (params.user_ids) qs.set("user_ids", params.user_ids);
			if (params.start_date) qs.set("start_date", params.start_date);
			if (params.end_date) qs.set("end_date", params.end_date);
			if (params.days !== undefined) qs.set("days", String(params.days));
			if (params.page !== undefined) qs.set("page", String(params.page));
			if (params.page_size !== undefined) qs.set("page_size", String(params.page_size));
			if (params.tenant_id) qs.set("tenant_id", params.tenant_id);

			let url: string;
			if (waAccountId) {
				url = buildApiUrl(WA.GET_USERS(waAccountId)) + `?${qs.toString()}`;
			} else {
				url = buildApiUrl(WA.GET_USERS_AUTO) + `?${qs.toString()}`;
			}

			return await get<WAGetUsersResponse>(url);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load audience";
			toast({ title: "Audience load failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Get message templates ──────────────────────────────────────────────────
	const getMessageTemplates = async (
		waAccountId?: string,
		params?: { name?: string; status?: string; category?: string; limit?: number }
	): Promise<WAGetTemplatesResponse> => {
		setIsLoading(true);
		try {
			const qs = new URLSearchParams();
			if (params?.name) qs.set("name", params.name);
			if (params?.status) qs.set("status", params.status);
			if (params?.category) qs.set("category", params.category);
			if (params?.limit) qs.set("limit", String(params.limit));

			let url: string;
			if (waAccountId) {
				url = buildApiUrl(WA.MESSAGE_TEMPLATES(waAccountId)) + (qs.toString() ? `?${qs.toString()}` : "");
			} else {
				url = buildApiUrl(WA.MESSAGE_TEMPLATES_AUTO) + (qs.toString() ? `?${qs.toString()}` : "");
			}

			return await get<WAGetTemplatesResponse>(url);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load templates";
			toast({ title: "Templates load failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Get credentials ────────────────────────────────────────────────────────
	const getCredentials = async (waAccountId?: string): Promise<WACredentials> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.CREDENTIALS_SCOPED(waAccountId))
				: buildApiUrl(WA.CREDENTIALS);

			return await get<WACredentials>(url);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load credentials";
			toast({ title: "Credentials load failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Save credentials ───────────────────────────────────────────────────────
	const saveCredentials = async (
		payload: WASaveCredentialsPayload,
		waAccountId?: string
	): Promise<WACredentials> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.CREDENTIALS_SCOPED(waAccountId))
				: buildApiUrl(WA.CREDENTIALS);

			const res = await fetch(url, {
				method: "PUT",
				headers: { "Content-Type": "application/json", ...getAuthHeaders() },
				body: JSON.stringify(payload),
			});
			const json = await res.json();
			if (!json.success) {
				throw new Error(json.message || "Failed to save credentials");
			}
			toast({ title: "Credentials saved", description: "WhatsApp credentials updated successfully" });
			return json as WACredentials;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to save credentials";
			toast({ title: "Save failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Send template ──────────────────────────────────────────────────────────
	const sendTemplate = async (
		payload: WASendSinglePayload,
		waAccountId?: string
	): Promise<WASendSingleResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND(waAccountId))
				: buildApiUrl(WA.SEND_AUTO);

			const body = waAccountId
				? payload
				: { ...payload, whatsapp_account_id: waAccountId };

			const data = await post<WASendSingleResult>(url, body);
			toast({ title: "Template sent", description: `Delivered to ${data.to}` });
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Send failed";
			toast({ title: "Send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Send by category ──────────────────────────────────────────────────────
	const sendByCategory = async (
		payload: WASendByCategoryPayload,
		waAccountId?: string
	): Promise<WASendBulkResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND_BY_CATEGORY(waAccountId))
				: buildApiUrl(WA.SEND_BY_CATEGORY_AUTO);

			const body = waAccountId
				? payload
				: { ...payload, whatsapp_account_id: waAccountId };

			const data = await post<WASendBulkResult>(url, body);
			toast({
				title: "Category send complete",
				description: `${data.sent} sent, ${data.failed} failed out of ${data.total}`,
			});
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Category send failed";
			toast({ title: "Send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Send by user IDs ──────────────────────────────────────────────────────
	const sendByUserIds = async (
		payload: WASendByUserIdsPayload,
		waAccountId?: string
	): Promise<WASendBulkResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND_BY_USER_IDS(waAccountId))
				: buildApiUrl(WA.SEND_BY_USER_IDS_AUTO);

			const body = waAccountId
				? payload
				: { ...payload, whatsapp_account_id: waAccountId };

			const data = await post<WASendBulkResult>(url, body);
			toast({
				title: "Send complete",
				description: `${data.sent} sent, ${data.failed} failed out of ${data.total}`,
			});
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Send by user IDs failed";
			toast({ title: "Send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Send by date range ────────────────────────────────────────────────────
	const sendByDateRange = async (
		payload: WASendByDateRangePayload,
		waAccountId?: string
	): Promise<WASendBulkResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND_BY_DATE_RANGE(waAccountId))
				: buildApiUrl(WA.SEND_BY_DATE_RANGE_AUTO);

			const body = waAccountId
				? payload
				: { ...payload, whatsapp_account_id: waAccountId };

			const data = await post<WASendBulkResult>(url, body);
			toast({
				title: "Date range send complete",
				description: `${data.sent} sent, ${data.failed} failed out of ${data.total}`,
			});
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Date range send failed";
			toast({ title: "Send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		isLoading,
		sendSingle,
		sendBulk,
		getUsers,
		sendByCategory,
		sendByUserIds,
		sendByDateRange,
		getMessageTemplates,
		getCredentials,
		saveCredentials,
		sendTemplate,
	};
};

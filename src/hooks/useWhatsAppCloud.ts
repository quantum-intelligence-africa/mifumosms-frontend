import { useState } from "react";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WAMediaType = "image" | "document" | "video";

export interface WAMediaFields {
	media_url?: string;
	media_type?: WAMediaType;
	filename?: string;
	media_file?: File;
	poll_id?: string;
}

export interface WASendSinglePayload extends WAMediaFields {
	to: string;
	type?: "text" | "template" | "image" | "document" | "video" | "poll";
	text?: string;
	template_name?: string;
	language_code?: string;
	components?: unknown[];
}

export interface WASendBulkPayload extends WAMediaFields {
	recipients: string[];
	text?: string;
	delay_ms?: number;
}

export interface WAPollOption {
	option: string;
	option_id: string;
	at: string;
}

export interface WAPollResponseItem extends WAPollOption {
	phone: string;
	name?: string;
	email?: string;
	tags?: string[];
}

export interface WAPoll {
	id: string;
	title: string;
	question: string;
	options: string[];
	is_active: boolean;
	created_at: string;
}

export interface WACreatePollPayload {
	title: string;
	question: string;
	options: string[];
	is_active?: boolean;
}

export interface WACreatePollResponse {
	success: boolean;
	poll: WAPoll;
	message?: string;
}

export interface WAPollListItem extends WAPoll {
	/** Latest count of responses (some backends include this for free; harmless if absent). */
	response_count?: number;
}

export interface WAPollListResponse {
	success?: boolean;
	count?: number;
	results?: WAPollListItem[];
	/** Some backends return a bare array; the hook normalises both shapes. */
	items?: WAPollListItem[];
	page?: number;
	page_size?: number;
	has_next?: boolean;
}

export interface WAUpdatePollPayload {
	title?: string;
	question?: string;
	options?: string[];
	is_active?: boolean;
}

export interface WAPollResultsResponse {
	success: boolean;
	poll: {
		id: string;
		title: string;
		question: string;
		options: string[];
		is_active: boolean;
		created_at: string;
	};
	summary: {
		total: number;
		counts: Record<string, number>;
	};
	responses: {
		page: number;
		page_size: number;
		total: number;
		has_next: boolean;
		items: WAPollResponseItem[];
		/** Present when the request was served via `?all=1` or `?page_size=all`. */
		all_mode?: boolean;
		/** True when the all-mode cap was hit; client should paginate the rest. */
		truncated?: boolean;
		/** The all-mode cap (default 50 000) — only set when `truncated` is true. */
		max_items?: number;
	};
}

export interface WAPollResultsQuery {
	page?: number;
	/** Numeric page size (max `WHATSAPP_POLL_RESULTS_MAX_PAGE_SIZE`, default 10 000) or the literal "all". */
	page_size?: number | "all";
	option?: string;
	/** Convenience for `page_size=all` — equivalent to passing `page_size: "all"`. */
	all?: boolean;
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
	/** Free-text search forwarded to the backend `/messaging/contacts/?search=…`. */
	search?: string;
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

// Languages accepted by the Mifumo wrapper around Meta's template API.
// Meta supports many more, but this product is restricted to en + sw.
export type WATemplateLanguage = "en" | "sw";

// Meta-defined template categories.
export type WATemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";

// Statuses returned by Meta. PENDING is the spec name; older wrappers used
// PENDING_REVIEW so we accept both to stay backwards compatible.
export type WATemplateStatus =
	| "APPROVED"
	| "PENDING"
	| "PENDING_REVIEW"
	| "REJECTED"
	| "DISABLED";

export type WATemplateComponentType =
	| "HEADER"
	| "BODY"
	| "FOOTER"
	| "BUTTONS";

export type WATemplateHeaderFormat = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";

export interface WATemplateButton {
	type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
	text: string;
	url?: string;
	phone_number?: string;
}

export interface WATemplateComponent {
	type: WATemplateComponentType;
	format?: WATemplateHeaderFormat;
	text?: string;
	buttons?: WATemplateButton[];
	example?: Record<string, unknown>;
}

export interface WAMessageTemplate {
	id: string;
	name: string;
	status: WATemplateStatus;
	category?: WATemplateCategory | string;
	language?: WATemplateLanguage | string;
	components?: WATemplateComponent[];
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

export interface WACreateTemplatePayload {
	name: string;
	language: WATemplateLanguage;
	category: WATemplateCategory;
	components: WATemplateComponent[];
}

// ─── Meta Cloud API template-send payloads ───────────────────────────────────
// Sending an approved template back to Meta requires the exact Cloud API
// `components` shape: one entry per component that carries variables, each with
// an ordered `parameters` array. See
// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates

export interface WATemplateTextParameter {
	type: "text";
	text: string;
	/** Set for Meta named parameters ({{customer_name}}); omitted for positional {{1}}. */
	parameter_name?: string;
}

export interface WATemplateMediaParameter {
	type: "image" | "video" | "document";
	image?: { link: string };
	video?: { link: string };
	document?: { link: string; filename?: string };
}

export interface WATemplateCurrencyParameter {
	type: "currency";
	currency: { fallback_value: string; code: string; amount_1000: number };
}

export interface WATemplateDateTimeParameter {
	type: "date_time";
	date_time: { fallback_value: string };
}

export type WATemplateSendParameter =
	| WATemplateTextParameter
	| WATemplateMediaParameter
	| WATemplateCurrencyParameter
	| WATemplateDateTimeParameter;

export interface WATemplateSendComponent {
	type: "header" | "body" | "button";
	/** Required for BUTTON components. */
	sub_type?: "quick_reply" | "url" | "catalog" | "copy_code";
	/** Required for BUTTON components — the zero-based button index, as a string. */
	index?: string;
	parameters: WATemplateSendParameter[];
}

// Single-recipient approved-template send via the Meta Cloud API. The backend
// `/send/` endpoint forwards `template` to Graph verbatim, so the `components`
// array MUST follow Meta's structure exactly.
export interface WASendTemplateMessagePayload {
	to: string;
	template_name: string;
	language_code: string;
	components?: WATemplateSendComponent[];
	// Optional header-media upload: when set, the file is uploaded to Meta and the
	// resulting media_id is bound into the template's header server-side (more
	// reliable than a public link). `media_type` is image/video/document.
	media_file?: File;
	media_type?: "image" | "video" | "document";
}

export interface WACreateTemplateResult {
	name: string;
	language: WATemplateLanguage;
	ok: boolean;
	http_status: number;
	graph: {
		id: string;
		status: WATemplateStatus;
		category: WATemplateCategory;
	};
}

// Edits target a Meta template id and may only change category/components.
export interface WAEditTemplatePayload {
	category?: WATemplateCategory;
	components?: WATemplateComponent[];
}

export interface WAEditTemplateResult {
	template_id: string;
	ok: boolean;
	http_status: number;
	graph: { success: boolean };
}

export interface WADeleteTemplateParams {
	name: string;
	hsm_id?: string;
}

export interface WADeleteTemplateResult {
	name: string;
	hsm_id: string | null;
	ok: boolean;
	http_status: number;
	graph: { success: boolean };
}

// Local-template send. The server resolves each recipient's Contact row and
// auto-fills {{name}}/{{phone}}/{{email}} + any Contact.attributes[key]; values
// in `variables` win on conflict. Under the hood Meta sees a plain text message.
export interface WASendFromTemplatePayload {
	template_id: string;
	recipients?: string[];
	user_ids?: string[];
	variables?: Record<string, string | number>;
	delay_ms?: number;
}

/** One body-parameter mapping: which contact field fills placeholder `token`. */
export interface WATemplateParamMapping {
	/** Placeholder token: "1"/"2" (positional) or a name ("customer_name"). */
	token: string;
	/** "name" | "phone" | "email" | "attr:<key>" | "static:<value>". */
	source: string;
}

export interface WASendApprovedTemplateBulkPayload {
	template_name: string;
	language_code?: string;
	recipients: string[];
	param_map?: WATemplateParamMapping[];
	/** Optional shared header image for all recipients (URL or uploaded file). */
	media_url?: string;
	media_file?: File;
	media_type?: "image" | "video" | "document";
}

export interface WASendFromTemplateRow {
	to: string;
	contact_id?: string;
	contact_name?: string;
	ok: boolean;
	http_status: number;
	message_id?: string;
	error?: string;
	missing_variables?: string[];
	data?: unknown;
}

export interface WASendFromTemplateResult {
	success: boolean;
	whatsapp_account_id: string;
	template_id: string;
	template_name: string;
	language: WATemplateLanguage | string;
	tenant_id?: string;
	sample_rendered?: string;
	total: number;
	sent: number;
	failed: number;
	results: WASendFromTemplateRow[];
	// §1.3 — credit accounting included in successful responses.
	credits_before?: number;
	credits_after?: number;
	credits_used?: number;
	// §1.4 extras when send-template-rich was hit with media/poll.
	poll_id?: string;
	media_id?: string;
	media_type?: "image" | "document" | "video";
}

// §1.4 — combined send: template body + optional media + optional poll, all in
// one Meta message. The rendered template is reused as the media caption or
// poll prefix server-side, so recipients see ONE WhatsApp message.
export interface WASendTemplateRichPayload {
	template_id: string;
	recipients?: string[];
	user_ids?: string[];
	variables?: Record<string, string | number>;
	delay_ms?: number;
	// Media: URL OR file (multipart). `media_type` is required when sending media.
	media_url?: string;
	media_file?: File;
	media_type?: "image" | "document" | "video";
	filename?: string;
	// Poll attaches an interactive message; backend wraps the rendered template
	// as the poll prefix.
	poll_id?: string;
}

// §1.3 / §1.4 — 402 Payment Required body. We surface it as a typed error so
// callers can render a "top up" CTA.
export class WAInsufficientCreditsError extends Error {
	credits_required: number;
	credits_available: number;
	constructor(message: string, required: number, available: number) {
		super(message);
		this.name = "WAInsufficientCreditsError";
		this.credits_required = required;
		this.credits_available = available;
	}
}

// §2.2 / §2.3 — builder shapes for the Meta template form.
export type WASimpleHeaderType = "none" | "text" | "image" | "video" | "document";

export interface WASimpleButton {
	type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
	text: string;
	url?: string;
	phone_number?: string;
	example?: string[];
}

export interface WASimpleTemplatePayload {
	name: string;
	category: WATemplateCategory;
	language: string; // any Meta BCP-47 code
	header_type?: WASimpleHeaderType;
	header_text?: string;
	header_text_example?: string;
	header_url?: string;
	header_file?: File;
	filename?: string;
	body: string;
	body_examples?: string[];
	footer?: string;
	buttons?: WASimpleButton[];
}

export interface WASimplePreviewRendered {
	header?: { format?: string; text?: string; url?: string };
	body?: string;
	footer?: string;
	buttons?: Array<Record<string, unknown>>;
}

export interface WASimplePreviewResult {
	success: boolean;
	data: {
		name: string;
		language: string;
		category: WATemplateCategory;
		rendered: WASimplePreviewRendered;
		components: Array<Record<string, unknown>>;
	};
}

export interface WASimpleCreateResult {
	name: string;
	language: string;
	category: WATemplateCategory;
	ok: boolean;
	http_status: number;
	graph: { id: string; status: WATemplateStatus; category: WATemplateCategory };
	header_media?: {
		stored_path: string;
		url: string;
		size_bytes: number;
		filename: string;
	};
}

// Returned by GET /messaging/templates/available-variables/ — a fixed picker
// of placeholders auto-filled from messaging.Contact at send time.
export interface WATemplateVariable {
	key: string;
	label: string;
	source: string;
	description?: string;
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
		// Gateway/proxy errors (502/504) and crashes return HTML, not JSON — guard
		// the parse so callers get a legible status instead of "Unexpected token <".
		const json = await res.json().catch(() => null);
		if (!res.ok) {
			const serverMsg = json?.message || json?.error || json?.detail;
			const gateway =
				res.status === 502 || res.status === 503 || res.status === 504
					? "WhatsApp service is temporarily unavailable"
					: null;
			throw new Error(serverMsg || gateway || `Server error (HTTP ${res.status})`);
		}
		if (!json) {
			throw new Error(`Unexpected empty response (HTTP ${res.status})`);
		}
		if (json.success === false) {
			// WhatsApp send failures nest Meta's Graph error under data.* — surface the
			// most specific message (e.g. the #132000 param-count detail) instead of a
			// generic "Request failed".
			const d = json?.data ?? {};
			const metaErr =
				d?.data?.error?.error_data?.details ||
				d?.data?.error?.message ||
				d?.error;
			throw new Error(metaErr || json.message || json.error || "Request failed");
		}
		return json.data as T;
	};

	// ── Multipart POST helper (for media_file uploads) ─────────────────────────
	const postMultipart = async <T>(url: string, fields: Record<string, unknown>, file: File, fileField = "media_file"): Promise<T> => {
		const form = new FormData();
		for (const [key, value] of Object.entries(fields)) {
			if (value === undefined || value === null) continue;
			if (Array.isArray(value) || typeof value === "object") {
				form.append(key, JSON.stringify(value));
			} else {
				form.append(key, String(value));
			}
		}
		form.append(fileField, file);

		const res = await fetch(url, {
			method: "POST",
			headers: { ...getAuthHeaders() },
			body: form,
		});
		const json = await res.json();
		if (!json.success) {
			const msg = json.message || json.error || "Request failed";
			throw new Error(msg);
		}
		return json.data as T;
	};

	// Decide between JSON and multipart based on presence of `media_file`.
	const postSmart = async <T>(url: string, payload: WAMediaFields & Record<string, unknown>): Promise<T> => {
		const { media_file, ...rest } = payload;
		if (media_file instanceof File) {
			return postMultipart<T>(url, rest, media_file);
		}
		return post<T>(url, rest);
	};

	// ── GET helper ─────────────────────────────────────────────────────────────
	const get = async <T>(url: string): Promise<T> => {
		const res = await fetch(url, {
			headers: { Accept: "application/json", ...getAuthHeaders() },
		});
		const json = await res.json().catch(() => null);
		if (!res.ok) {
			const msg = json?.message || json?.error || json?.detail || `HTTP ${res.status}`;
			throw new Error(msg);
		}
		if (json && json.success === false) {
			throw new Error(json.message || json.error || "Request failed");
		}
		return json as T;
	};

	// ── Resolve poll identifier ───────────────────────────────────────────────
	// Users may paste either a poll UUID (legacy) or a poll title (new "Poll Name"
	// UX). The send endpoints want a UUID, so when the input is a name, hit the
	// by-name metadata endpoint to fetch it. UUID-shaped input passes through.
	const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const resolvePollId = async (input: string): Promise<string> => {
		const trimmed = input.trim();
		if (!trimmed) return trimmed;
		if (UUID_RE.test(trimmed)) return trimmed;
		const url = buildApiUrl(WA.POLL_BY_NAME(trimmed));
		const json = await get<{ success?: boolean; poll?: WAPoll } & WAPoll>(url);
		const poll: WAPoll | undefined =
			json?.poll ?? (json && "id" in json ? (json as WAPoll) : undefined);
		if (!poll?.id) throw new Error(`No poll named "${trimmed}"`);
		return poll.id;
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

			const resolved = payload.poll_id
				? { ...payload, poll_id: await resolvePollId(payload.poll_id) }
				: payload;

			const body = waAccountId
				? resolved
				: { ...resolved, whatsapp_account_id: waAccountId };

			const data = await postSmart<WASendSingleResult>(url, body as WAMediaFields & Record<string, unknown>);
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
	): Promise<WASendBulkResult & { media_id?: string; poll_id?: string }> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND_BULK(waAccountId))
				: buildApiUrl(WA.SEND_BULK_AUTO);

			const resolved = payload.poll_id
				? { ...payload, poll_id: await resolvePollId(payload.poll_id) }
				: payload;

			// Backend accepts both `recipients` and `phone_numbers` — pass both for safety.
			const { recipients, ...rest } = resolved;
			const body = waAccountId
				? { ...rest, recipients, phone_numbers: recipients }
				: { ...rest, recipients, phone_numbers: recipients, whatsapp_account_id: waAccountId };

			const data = await postSmart<WASendBulkResult & { media_id?: string; poll_id?: string }>(url, body as WAMediaFields & Record<string, unknown>);
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

	// ── Get users ─────────────────────────────────────────────────────────────
	// Uses the generic /messaging/contacts/ endpoint (the only working source
	// of audience data on this deployment). DRF paginated response is mapped
	// into the WAUser/WAGetUsersResponse shape so existing callers don't change.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const getUsers = async (
		params: WAGetUsersParams,
		_waAccountId?: string
	): Promise<WAGetUsersResponse> => {
		setIsLoading(true);
		try {
			const qs = new URLSearchParams();
			if (params.page !== undefined) qs.set("page", String(params.page));
			if (params.page_size !== undefined) qs.set("page_size", String(params.page_size));
			if (params.search && params.search.trim()) qs.set("search", params.search.trim());

			const url = buildApiUrl(API_CONFIG.ENDPOINTS.MESSAGING.CONTACTS.BASE) + `?${qs.toString()}`;
			const res = await fetch(url, {
				headers: { Accept: "application/json", ...getAuthHeaders() },
			});
			if (!res.ok) {
				const json = await res.json().catch(() => null);
				throw new Error(json?.message || json?.error || json?.detail || `HTTP ${res.status}`);
			}
			const json = await res.json();
			// DRF paginated response: { results: Contact[], count, next, previous }
			const contacts: Array<Record<string, unknown>> = Array.isArray(json?.results)
				? json.results
				: Array.isArray(json)
					? json
					: [];
			const users: WAUser[] = contacts.map(c => ({
				user_id: String(c.id ?? ""),
				phone_number: String(c.phone_e164 ?? c.phone_number ?? ""),
				name: String(c.name ?? ""),
				email: String(c.email ?? ""),
				is_active: Boolean(c.is_active ?? true),
				tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
			}));
			const total: number | undefined = typeof json?.count === "number" ? json.count : undefined;
			const pageSize = params.page_size ?? users.length;
			const page = params.page ?? 1;
			return {
				query_type: params.type ?? "contacts",
				count: users.length,
				users,
				total,
				page,
				page_size: pageSize,
				has_next: typeof json?.next === "string" && json.next.length > 0,
				has_previous: typeof json?.previous === "string" && json.previous.length > 0,
			};
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

	// ── Create message template ───────────────────────────────────────────────
	// Submits a new template to Meta for review. Status starts as PENDING.
	const createMessageTemplate = async (
		payload: WACreateTemplatePayload,
		waAccountId?: string,
	): Promise<WACreateTemplateResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.MESSAGE_TEMPLATES(waAccountId))
				: buildApiUrl(WA.MESSAGE_TEMPLATES_AUTO);
			const data = await post<WACreateTemplateResult>(url, payload);
			toast({
				title: "Template submitted",
				description: `${payload.name} is awaiting Meta review`,
			});
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to create template";
			toast({ title: "Couldn't create template", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Edit message template ─────────────────────────────────────────────────
	// Only category and components can change. Name/language are immutable.
	// Meta resets status to PENDING after a successful edit.
	const editMessageTemplate = async (
		templateId: string,
		payload: WAEditTemplatePayload,
		waAccountId?: string,
	): Promise<WAEditTemplateResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.MESSAGE_TEMPLATE_DETAIL(waAccountId, templateId))
				: buildApiUrl(WA.MESSAGE_TEMPLATE_DETAIL_AUTO(templateId));
			const data = await post<WAEditTemplateResult>(url, payload);
			toast({ title: "Template updated", description: "Awaiting Meta re-review" });
			return data;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to update template";
			toast({ title: "Couldn't update template", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Delete message template ───────────────────────────────────────────────
	// DELETE /message-templates/?name=… (all language versions) or with
	// &hsm_id=<id> to drop a single language version.
	const deleteMessageTemplate = async (
		params: WADeleteTemplateParams,
		waAccountId?: string,
	): Promise<WADeleteTemplateResult> => {
		setIsLoading(true);
		try {
			const qs = new URLSearchParams();
			qs.set("name", params.name);
			if (params.hsm_id) qs.set("hsm_id", params.hsm_id);
			const base = waAccountId
				? buildApiUrl(WA.MESSAGE_TEMPLATES(waAccountId))
				: buildApiUrl(WA.MESSAGE_TEMPLATES_AUTO);
			const url = `${base}?${qs.toString()}`;
			const res = await fetch(url, {
				method: "DELETE",
				headers: { Accept: "application/json", ...getAuthHeaders() },
			});
			const json = await res.json().catch(() => null);
			if (!res.ok || (json && json.success === false)) {
				const msg = json?.message || json?.error || json?.detail || `HTTP ${res.status}`;
				throw new Error(msg);
			}
			toast({ title: "Template deleted", description: params.name });
			return json.data as WADeleteTemplateResult;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to delete template";
			toast({ title: "Couldn't delete template", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Fixed picker of placeholders auto-filled from Contact at send time ────
	// GET /messaging/templates/available-variables/
	const getAvailableVariables = async (): Promise<WATemplateVariable[]> => {
		try {
			const url = buildApiUrl(API_CONFIG.ENDPOINTS.MESSAGING.TEMPLATE_AVAILABLE_VARIABLES);
			const json = await get<{ success?: boolean; data?: { variables?: WATemplateVariable[] } }>(url);
			return json?.data?.variables ?? [];
		} catch (err) {
			// Picker is optional — surface but don't toast spam.
			console.warn("Failed to load template variables:", err);
			return [];
		}
	};

	// ── Render a local template and send as plain WhatsApp text ───────────────
	// POST /send-from-template/ — recipients OR user_ids (max 500). The server
	// looks up each recipient's Contact and auto-fills {{name}}/{{phone}}/{{email}}
	// plus Contact.attributes[key]; `variables` overrides on conflict.
	const sendFromTemplate = async (
		payload: WASendFromTemplatePayload,
		waAccountId?: string,
	): Promise<WASendFromTemplateResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND_FROM_TEMPLATE(waAccountId))
				: buildApiUrl(WA.SEND_FROM_TEMPLATE_AUTO);
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", ...getAuthHeaders() },
				body: JSON.stringify(payload),
			});
			const json = await res.json().catch(() => null);
			// §1.3 — surface the 402 "insufficient credits" body as a typed error.
			if (res.status === 402 && json && typeof json.credits_required === "number") {
				throw new WAInsufficientCreditsError(
					json.message || "Insufficient WhatsApp credits.",
					Number(json.credits_required) || 0,
					Number(json.credits_available) || 0,
				);
			}
			if (!res.ok) {
				const msg = json?.message || json?.error || json?.detail || `HTTP ${res.status}`;
				throw new Error(msg);
			}
			const data = json as WASendFromTemplateResult;
			toast({
				title: data.success ? "Template sent" : "Template send completed with errors",
				description: `${data.sent} sent, ${data.failed} failed of ${data.total}`,
				variant: data.success ? "default" : "destructive",
			});
			return data;
		} catch (err) {
			if (err instanceof WAInsufficientCreditsError) {
				toast({
					title: "Out of WhatsApp credits",
					description: `Need ${err.credits_required}, have ${err.credits_available}. Top up to continue.`,
					variant: "destructive",
				});
				throw err;
			}
			const msg = err instanceof Error ? err.message : "Template send failed";
			toast({ title: "Send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Bulk APPROVED Meta template with per-recipient field-mapped params ─────
	// Real type=template send (delivers outside the 24h window). Each {{n}} maps
	// to a contact field via `param_map` and resolves per recipient server-side.
	const sendApprovedTemplateBulk = async (
		payload: WASendApprovedTemplateBulkPayload,
		waAccountId?: string,
	): Promise<WASendFromTemplateResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND_APPROVED_TEMPLATE_BULK(waAccountId))
				: buildApiUrl(WA.SEND_APPROVED_TEMPLATE_BULK_AUTO);

			// Multipart only when a header image file is attached; else JSON.
			let res: Response;
			if (payload.media_file instanceof File) {
				const form = new FormData();
				form.append("template_name", payload.template_name);
				if (payload.language_code) form.append("language_code", payload.language_code);
				form.append("recipients", JSON.stringify(payload.recipients));
				form.append("param_map", JSON.stringify(payload.param_map ?? []));
				if (payload.media_type) form.append("media_type", payload.media_type);
				form.append("media_file", payload.media_file);
				res = await fetch(url, { method: "POST", headers: getAuthHeaders(), body: form });
			} else {
				res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json", ...getAuthHeaders() },
					body: JSON.stringify({
						template_name: payload.template_name,
						language_code: payload.language_code,
						recipients: payload.recipients,
						param_map: payload.param_map ?? [],
						...(payload.media_url ? { media_url: payload.media_url } : {}),
						...(payload.media_type ? { media_type: payload.media_type } : {}),
					}),
				});
			}

			const json = await res.json().catch(() => null);
			if (res.status === 402 && json && typeof json.credits_required === "number") {
				throw new WAInsufficientCreditsError(
					json.message || "Insufficient WhatsApp credits.",
					Number(json.credits_required) || 0,
					Number(json.credits_available) || 0,
				);
			}
			if (!res.ok) {
				const msg = json?.message || json?.error || json?.detail || `HTTP ${res.status}`;
				throw new Error(msg);
			}
			const data = json as WASendFromTemplateResult;
			toast({
				title: data.success ? "Template sent" : "Template send completed with errors",
				description: `${data.sent} sent, ${data.failed} failed of ${data.total}`,
				variant: data.success ? "default" : "destructive",
			});
			return data;
		} catch (err) {
			if (err instanceof WAInsufficientCreditsError) {
				toast({
					title: "Out of WhatsApp credits",
					description: `Need ${err.credits_required}, have ${err.credits_available}. Top up to continue.`,
					variant: "destructive",
				});
				throw err;
			}
			const msg = err instanceof Error ? err.message : "Bulk template send failed";
			toast({ title: "Send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Send rich (template + media + poll) — §1.4 ────────────────────────────
	// One call delivers template body + optional image/document/video + optional
	// poll as a single Meta message. Multipart is auto-detected from media_file.
	const sendTemplateRich = async (
		payload: WASendTemplateRichPayload,
		waAccountId?: string,
	): Promise<WASendFromTemplateResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND_TEMPLATE_RICH(waAccountId))
				: buildApiUrl(WA.SEND_TEMPLATE_RICH_AUTO);

			const { media_file, ...rest } = payload;
			let res: Response;
			if (media_file instanceof File) {
				// Multipart: list/object fields are stringified per the spec.
				const form = new FormData();
				for (const [k, v] of Object.entries(rest)) {
					if (v === undefined || v === null) continue;
					if (Array.isArray(v) || typeof v === "object") {
						form.append(k, JSON.stringify(v));
					} else {
						form.append(k, String(v));
					}
				}
				form.append("media_file", media_file);
				res = await fetch(url, { method: "POST", headers: getAuthHeaders(), body: form });
			} else {
				res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json", ...getAuthHeaders() },
					body: JSON.stringify(rest),
				});
			}

			const json = await res.json().catch(() => null);
			if (res.status === 402 && json && typeof json.credits_required === "number") {
				throw new WAInsufficientCreditsError(
					json.message || "Insufficient WhatsApp credits.",
					Number(json.credits_required) || 0,
					Number(json.credits_available) || 0,
				);
			}
			if (!res.ok) {
				const msg = json?.message || json?.error || json?.detail || `HTTP ${res.status}`;
				throw new Error(msg);
			}
			const data = json as WASendFromTemplateResult;
			toast({
				title: data.success ? "Template + attachments sent" : "Template send completed with errors",
				description: `${data.sent} sent, ${data.failed} failed of ${data.total}`,
				variant: data.success ? "default" : "destructive",
			});
			return data;
		} catch (err) {
			if (err instanceof WAInsufficientCreditsError) {
				toast({
					title: "Out of WhatsApp credits",
					description: `Need ${err.credits_required}, have ${err.credits_available}. Top up to continue.`,
					variant: "destructive",
				});
				throw err;
			}
			const msg = err instanceof Error ? err.message : "Template send failed";
			toast({ title: "Send failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── §2.2 / §2.3 — Meta template builder + preview ─────────────────────────
	// `preview` returns rendered text + final components without submitting.
	// `simpleCreateMetaTemplate` submits the same body to Meta for review.
	const buildSimplePayload = (payload: WASimpleTemplatePayload): { form?: FormData; json?: WASimpleTemplatePayload } => {
		const { header_file, buttons, body_examples, ...rest } = payload;
		if (header_file instanceof File) {
			const form = new FormData();
			for (const [k, v] of Object.entries(rest)) {
				if (v === undefined || v === null) continue;
				form.append(k, String(v));
			}
			if (Array.isArray(body_examples)) form.append("body_examples", JSON.stringify(body_examples));
			if (Array.isArray(buttons)) form.append("buttons", JSON.stringify(buttons));
			form.append("header_file", header_file);
			return { form };
		}
		return { json: payload };
	};

	const simplePreviewMetaTemplate = async (
		payload: WASimpleTemplatePayload,
		waAccountId?: string,
	): Promise<WASimplePreviewResult["data"]> => {
		const url = waAccountId
			? buildApiUrl(WA.MESSAGE_TEMPLATES_SIMPLE_PREVIEW(waAccountId))
			: buildApiUrl(WA.MESSAGE_TEMPLATES_SIMPLE_PREVIEW_AUTO);
		const built = buildSimplePayload(payload);
		const res = built.form
			? await fetch(url, { method: "POST", headers: getAuthHeaders(), body: built.form })
			: await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json", ...getAuthHeaders() },
					body: JSON.stringify(built.json),
				});
		const json = await res.json().catch(() => null);
		if (!res.ok || !json?.success) {
			throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
		}
		return json.data as WASimplePreviewResult["data"];
	};

	const simpleCreateMetaTemplate = async (
		payload: WASimpleTemplatePayload,
		waAccountId?: string,
	): Promise<WASimpleCreateResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.MESSAGE_TEMPLATES_SIMPLE(waAccountId))
				: buildApiUrl(WA.MESSAGE_TEMPLATES_SIMPLE_AUTO);
			const built = buildSimplePayload(payload);
			const res = built.form
				? await fetch(url, { method: "POST", headers: getAuthHeaders(), body: built.form })
				: await fetch(url, {
						method: "POST",
						headers: { "Content-Type": "application/json", ...getAuthHeaders() },
						body: JSON.stringify(built.json),
					});
			const json = await res.json().catch(() => null);
			if (!res.ok || !json?.success) {
				throw new Error(json?.message || json?.error || `HTTP ${res.status}`);
			}
			toast({ title: "Template submitted", description: `${payload.name} is awaiting Meta review` });
			return json.data as WASimpleCreateResult;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to submit template";
			toast({ title: "Couldn't submit", description: msg, variant: "destructive" });
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

	// ── Send an approved Meta template (Cloud API structure) ──────────────────
	// Posts to the same `/send/` endpoint as sendSingle but with `type: "template"`
	// and the canonical Meta `template` block. Use this for messages built from a
	// Meta-APPROVED template with resolved {{1}}, {{2}} … parameters.
	const sendTemplateMessage = async (
		payload: WASendTemplateMessagePayload,
		waAccountId?: string,
	): Promise<WASendSingleResult> => {
		setIsLoading(true);
		try {
			const url = waAccountId
				? buildApiUrl(WA.SEND(waAccountId))
				: buildApiUrl(WA.SEND_AUTO);

			const body: Record<string, unknown> = {
				to: payload.to,
				type: "template",
				template_name: payload.template_name,
				language_code: payload.language_code,
			};
			// Only attach components when the template actually has parameters —
			// sending an empty/extra component trips Meta's #132000 param-count check.
			if (payload.components && payload.components.length > 0) {
				body.components = payload.components;
			}
			// On the auto endpoint the server resolves the account itself; pass the
			// id explicitly only when we actually have one for the scoped route.
			if (waAccountId) body.whatsapp_account_id = waAccountId;
			// Header-media upload: attach the file so the server uploads it to Meta
			// and binds the media_id into the header. postSmart switches to multipart
			// automatically when a File is present (otherwise it posts JSON).
			if (payload.media_file instanceof File) {
				body.media_file = payload.media_file;
				if (payload.media_type) body.media_type = payload.media_type;
			}

			const data = await postSmart<WASendSingleResult>(
				url,
				body as WAMediaFields & Record<string, unknown>,
			);
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

	// Build the ?page=…&page_size=…&option=…&all=1 string per the poll results spec.
	// Accepts either `all: true`, `page_size: "all"`, or numeric pagination. When
	// `all` is requested, `page` is omitted (server returns everything on page 1).
	const buildPollQuery = (params?: WAPollResultsQuery): string => {
		const qs = new URLSearchParams();
		const allMode = params?.all || params?.page_size === "all";
		if (allMode) {
			qs.set("all", "1");
		} else {
			if (params?.page !== undefined) qs.set("page", String(params.page));
			if (params?.page_size !== undefined) qs.set("page_size", String(params.page_size));
		}
		if (params?.option) qs.set("option", params.option);
		return qs.toString();
	};

	// ── Get poll results ──────────────────────────────────────────────────────
	const getPollResults = async (
		pollId: string,
		params?: WAPollResultsQuery
	): Promise<WAPollResultsResponse> => {
		setIsLoading(true);
		try {
			const qs = buildPollQuery(params);
			const url = buildApiUrl(WA.POLL_RESULTS(pollId)) + (qs ? `?${qs}` : "");
			return await get<WAPollResultsResponse>(url);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load poll results";
			toast({ title: "Poll results failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Get poll results by name ──────────────────────────────────────────────
	const getPollResultsByName = async (
		name: string,
		params?: WAPollResultsQuery
	): Promise<WAPollResultsResponse> => {
		setIsLoading(true);
		try {
			const qs = buildPollQuery(params);
			const url = buildApiUrl(WA.POLL_BY_NAME_RESULTS(name)) + (qs ? `?${qs}` : "");
			return await get<WAPollResultsResponse>(url);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load poll results";
			toast({ title: "Poll results failed", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Create a WhatsApp poll ────────────────────────────────────────────────
	const createPoll = async (payload: WACreatePollPayload): Promise<WACreatePollResponse> => {
		setIsLoading(true);
		try {
			const url = buildApiUrl(WA.POLL_CREATE);
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", ...getAuthHeaders() },
				body: JSON.stringify({
					title: payload.title.trim(),
					question: payload.question.trim(),
					options: payload.options.map((o) => o.trim()).filter(Boolean),
					is_active: payload.is_active !== false,
				}),
			});
			const json = await res.json().catch(() => null);
			if (!res.ok) {
				const msg =
					json?.message ||
					json?.error ||
					json?.detail ||
					(json && typeof json === "object" ? Object.values(json).flat().join(", ") : "") ||
					`HTTP ${res.status}`;
				throw new Error(msg);
			}
			// Backend may return {success, poll, ...} (wrapped), {data: poll} (post helper
			// convention), or the poll fields at the top level (DRF 201). Normalise here.
			const poll: WAPoll | undefined =
				json?.poll ?? json?.data?.poll ?? json?.data ?? (json?.id ? json : undefined);
			if (!poll?.id) {
				throw new Error("Unexpected response from server");
			}
			return { success: true, poll, message: json?.message };
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to create poll";
			toast({ title: "Couldn't create poll", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── List polls ────────────────────────────────────────────────────────────
	// GET /api/messaging/whatsapp/cloud/polls/ — owner sees their polls; staff sees all.
	const listPolls = async (params?: {
		page?: number;
		page_size?: number;
	}): Promise<WAPollListResponse> => {
		setIsLoading(true);
		try {
			const qs = new URLSearchParams();
			if (params?.page !== undefined) qs.set("page", String(params.page));
			if (params?.page_size !== undefined) qs.set("page_size", String(params.page_size));
			const url = buildApiUrl(WA.POLL_LIST) + (qs.toString() ? `?${qs.toString()}` : "");
			const res = await fetch(url, {
				headers: { Accept: "application/json", ...getAuthHeaders() },
			});
			const json = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(
					json?.message || json?.error || json?.detail || `HTTP ${res.status}`,
				);
			}
			// Backend may return DRF default `{results: [...]}`, a bare array, or
			// `{items: [...]}` — normalise so callers always get `.results`.
			if (Array.isArray(json)) return { results: json as WAPollListItem[] };
			if (json?.items && !json?.results) {
				return { ...(json as WAPollListResponse), results: json.items };
			}
			return json as WAPollListResponse;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load polls";
			toast({ title: "Couldn't load polls", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Retrieve one poll ─────────────────────────────────────────────────────
	const getPoll = async (pollId: string): Promise<WAPoll> => {
		setIsLoading(true);
		try {
			const url = buildApiUrl(WA.POLL_DETAIL(pollId));
			const res = await fetch(url, {
				headers: { Accept: "application/json", ...getAuthHeaders() },
			});
			const json = await res.json().catch(() => null);
			if (!res.ok) {
				throw new Error(
					json?.message || json?.error || json?.detail || `HTTP ${res.status}`,
				);
			}
			const poll: WAPoll | undefined =
				json?.poll ?? json?.data ?? (json?.id ? json : undefined);
			if (!poll?.id) throw new Error("Unexpected response from server");
			return poll;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load poll";
			toast({ title: "Couldn't load poll", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Update poll (PATCH) ───────────────────────────────────────────────────
	const updatePoll = async (
		pollId: string,
		payload: WAUpdatePollPayload,
	): Promise<WAPoll> => {
		setIsLoading(true);
		try {
			const url = buildApiUrl(WA.POLL_DETAIL(pollId));
			const res = await fetch(url, {
				method: "PATCH",
				headers: { "Content-Type": "application/json", ...getAuthHeaders() },
				body: JSON.stringify(payload),
			});
			const json = await res.json().catch(() => null);
			if (!res.ok) {
				const msg =
					json?.message ||
					json?.error ||
					json?.detail ||
					(json && typeof json === "object" ? Object.values(json).flat().join(", ") : "") ||
					`HTTP ${res.status}`;
				throw new Error(msg);
			}
			const poll: WAPoll | undefined =
				json?.poll ?? json?.data ?? (json?.id ? json : undefined);
			if (!poll?.id) throw new Error("Unexpected response from server");
			toast({ title: "Poll updated", description: poll.title });
			return poll;
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to update poll";
			toast({ title: "Couldn't update poll", description: msg, variant: "destructive" });
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// ── Delete poll (archive) ─────────────────────────────────────────────────
	const deletePoll = async (pollId: string): Promise<void> => {
		setIsLoading(true);
		try {
			const url = buildApiUrl(WA.POLL_DETAIL(pollId));
			const res = await fetch(url, {
				method: "DELETE",
				headers: { Accept: "application/json", ...getAuthHeaders() },
			});
			if (!res.ok && res.status !== 204) {
				const json = await res.json().catch(() => null);
				throw new Error(
					json?.message || json?.error || json?.detail || `HTTP ${res.status}`,
				);
			}
			toast({ title: "Poll archived" });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to delete poll";
			toast({ title: "Couldn't delete poll", description: msg, variant: "destructive" });
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
		createMessageTemplate,
		editMessageTemplate,
		deleteMessageTemplate,
		sendFromTemplate,
		sendTemplateRich,
		sendApprovedTemplateBulk,
		simplePreviewMetaTemplate,
		simpleCreateMetaTemplate,
		getAvailableVariables,
		getCredentials,
		saveCredentials,
		sendTemplate,
		sendTemplateMessage,
		getPollResults,
		getPollResultsByName,
		resolvePollId,
		createPoll,
		listPolls,
		getPoll,
		updatePoll,
		deletePoll,
	};
};

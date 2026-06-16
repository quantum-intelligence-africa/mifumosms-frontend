import { useState } from "react";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

export type WABulkJobStatus = "pending" | "running" | "completed" | "failed";

export interface WABulkContact {
  phone: string;
  name?: string;
}

export interface WABulkImageJob {
  job_id: string;
  job_status: WABulkJobStatus;
  total_contacts: number;
  matched: number;
  missing_images: number;
  sent: number;
  failed: number;
  caption_preview?: string;
  image_count: number;
  idempotency_key?: string;
  created_at: string;
  completed_at?: string | null;
  updated_at?: string;
  whatsapp_account_id?: string;
  error_row_count?: number;
  fatal_error?: string | null;
}

export interface WABulkImageJobError {
  phone?: string;
  name?: string;
  stage: string;
  detail?: string;
}

export interface WABulkImageJobDetail extends WABulkImageJob {
  errors?: WABulkImageJobError[];
}

export interface WABulkImageListResponse {
  success: boolean;
  page: number;
  page_size: number;
  total: number;
  has_next: boolean;
  items: WABulkImageJob[];
}

export interface WABulkImageCreateResponse extends WABulkImageJob {
  success: boolean;
  pending?: boolean;
  message?: string;
}

export interface WABulkImageCreatePayload {
  /** Images to upload — file name should match contact phone (digits only) or normalized name. */
  images: File[];
  /** Contact list (phone in E.164; optional name for caption `{name}` substitution). */
  contacts: WABulkContact[];
  /** Optional caption; supports `{name}` placeholder (image mode only). */
  caption?: string;
  /** Copilot id (omit to use the user's default WhatsApp-linked copilot). */
  whatsapp_account_id?: string;
  /** Block until job finishes (or timeout). */
  wait?: boolean;
  /** Replay protection — same key returns the existing completed job within 24h. */
  idempotency_key?: string;
  /** "image" (plain image + caption) or "template" (approved template, image header). */
  send_mode?: "image" | "template";
  /** Required when send_mode === "template". */
  template_name?: string;
  /** Template language code (e.g. "en", "sw"). Defaults to "en" server-side. */
  language_code?: string;
  /**
   * Base template components (body/buttons) as a JSON-serializable array. The
   * per-contact image header is injected server-side, so omit the header here.
   * `{name}`/`{phone}` tokens in body text params are personalized per contact.
   */
  components?: unknown[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useWhatsAppBulkImageSend = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const WA = API_CONFIG.ENDPOINTS.MESSAGING.WHATSAPP_CLOUD;

  // GET list of jobs
  const listJobs = async (params?: {
    page?: number;
    page_size?: number;
    job_status?: WABulkJobStatus;
  }): Promise<WABulkImageListResponse> => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (params?.page !== undefined) qs.set("page", String(params.page));
      if (params?.page_size !== undefined) qs.set("page_size", String(params.page_size));
      if (params?.job_status) qs.set("job_status", params.job_status);
      const url = buildApiUrl(WA.BULK_IMAGE_SEND) + (qs.toString() ? `?${qs.toString()}` : "");
      const res = await fetch(url, {
        headers: { Accept: "application/json", ...getAuthHeaders() },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          json?.message || json?.error || json?.detail || `HTTP ${res.status}`,
        );
      }
      return json as WABulkImageListResponse;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load jobs";
      toast({ title: "Couldn't load jobs", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // POST create a new job (multipart)
  const createJob = async (
    payload: WABulkImageCreatePayload,
  ): Promise<WABulkImageCreateResponse> => {
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append("contacts", JSON.stringify(payload.contacts));
      if (payload.caption) form.append("caption", payload.caption);
      if (payload.whatsapp_account_id)
        form.append("whatsapp_account_id", payload.whatsapp_account_id);
      if (payload.wait) form.append("wait", "1");
      if (payload.idempotency_key)
        form.append("idempotency_key", payload.idempotency_key);
      // Template mode: send_mode + template selection (+ optional base components).
      if (payload.send_mode) form.append("send_mode", payload.send_mode);
      if (payload.template_name) form.append("template_name", payload.template_name);
      if (payload.language_code) form.append("language_code", payload.language_code);
      if (payload.components && payload.components.length > 0)
        form.append("components", JSON.stringify(payload.components));
      for (const file of payload.images) {
        form.append("images", file);
      }

      const headers: Record<string, string> = { ...getAuthHeaders() };
      if (payload.idempotency_key) headers["Idempotency-Key"] = payload.idempotency_key;

      // Compute total payload size up-front so we can produce a friendly 413
      // message instead of the bare "Request Entity Too Large" the reverse
      // proxy returns (usually as HTML, not JSON).
      const totalBytes = payload.images.reduce((s, f) => s + f.size, 0);
      const url = buildApiUrl(WA.BULK_IMAGE_SEND);
      const res = await fetch(url, { method: "POST", headers, body: form });
      // 413 is normally served by nginx/Cloudflare with an HTML body, so json
      // parsing will fail — special-case it before we try to read the body.
      if (res.status === 413) {
        const mb = (totalBytes / (1024 * 1024)).toFixed(1);
        throw new Error(
          `Upload too large (${mb} MB across ${payload.images.length} images). ` +
            "The API server's nginx limit was hit before Django could process the request. " +
            "Send fewer/smaller images in one batch, or ask the backend team to raise " +
            "client_max_body_size on /api/whatsapp/bulk-image-send/.",
        );
      }
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
      // 202 = queued, 200 = finished synchronously (wait=1) or idempotent replay.
      const data = json as WABulkImageCreateResponse;
      if (data.job_status === "completed") {
        toast({
          title: "Bulk image send complete",
          description: `${data.sent} sent · ${data.failed} failed · ${data.missing_images} missing`,
        });
      } else {
        toast({
          title: "Bulk image job queued",
          description: data.message || "Poll the job detail for progress.",
        });
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start bulk image send";
      toast({ title: "Bulk send failed", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // GET job detail (optionally include per-row errors)
  const getJob = async (
    jobId: string,
    opts?: { include_errors?: boolean },
  ): Promise<WABulkImageJobDetail> => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (opts?.include_errors) qs.set("include_errors", "1");
      const url =
        buildApiUrl(WA.BULK_IMAGE_SEND_DETAIL(jobId)) +
        (qs.toString() ? `?${qs.toString()}` : "");
      const res = await fetch(url, {
        headers: { Accept: "application/json", ...getAuthHeaders() },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          json?.message || json?.error || json?.detail || `HTTP ${res.status}`,
        );
      }
      return json as WABulkImageJobDetail;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load job";
      toast({ title: "Couldn't load job", description: msg, variant: "destructive" });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, listJobs, createJob, getJob };
};

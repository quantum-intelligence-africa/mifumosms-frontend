// Noise-reduced ("enhanced") copies of call recordings: the organization's settings and one recording's status (SENDA Voice backend).
import { voiceApi } from "@/services/voiceApi";

export type EnhanceStatus = "none" | "pending" | "processing" | "ready" | "failed" | "skipped";
export type EnhanceEngine = "ffmpeg" | "deepfilter" | "rnnoise";
export type EnhanceIntensity = "low" | "medium" | "high";
export type EnhanceQuality = "standard" | "high";

export interface EnhancementSettings {
  enabled: boolean;
  auto: boolean;
  engine: EnhanceEngine;
  intensity: EnhanceIntensity;
  quality: EnhanceQuality;
  transcribe_enhanced: boolean;
  /** Which engines this server can run right now. */
  engines_available: Record<EnhanceEngine, boolean>;
  options: { engines: Array<{ value: EnhanceEngine; label: string }> };
}

export interface LoudnessReading { mean_db: number | null; peak_db: number | null }

export interface RecordingEnhancement {
  recording_id: string;
  enabled: boolean;
  status: EnhanceStatus;
  engine: EnhanceEngine;
  intensity: EnhanceIntensity;
  quality: EnhanceQuality;
  error: string;
  attempts: number;
  source: { sample_rate?: number; channels?: number; duration?: number; codec?: string };
  metrics: { before?: LoudnessReading; after?: LoudnessReading };
  finished_at: string | null;
  original_url: string;
  original_download_url: string;
  /** Empty until a copy exists (a failed or running regenerate keeps the earlier copy). */
  enhanced_url: string;
  enhanced_download_url: string;
  size_bytes: number | null;
  queued?: boolean;
}

export const enhancementApi = {
  settings: () => voiceApi.get<EnhancementSettings>("/voice/call-center/recording-enhancement/"),
  saveSettings: (body: Partial<Pick<EnhancementSettings, "enabled" | "auto" | "engine" | "intensity" | "quality" | "transcribe_enhanced">>) =>
    voiceApi.patch<EnhancementSettings>("/voice/call-center/recording-enhancement/", body),
  forRecording: (recordingId: string) => voiceApi.get<RecordingEnhancement>(`/voice/recordings/${recordingId}/enhancement/`),
  /** Make the copy, retry a failed one, or (``force``) make it again. */
  make: (recordingId: string, force = false) => voiceApi.post<RecordingEnhancement>(`/voice/recordings/${recordingId}/enhancement/`, { force }),
};

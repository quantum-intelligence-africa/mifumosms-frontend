import { useCallback, useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';

export type SendaStage =
  | 'new_user'
  | 'onboarding'
  | 'exploring'
  | 'sender_id_pending'
  | 'active_sender'
  | 'power_user'
  | 'at_risk_user'
  | 'inactive_user';

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  cta: string;
  completed: boolean;
  completed_at?: string | null;
}

export interface OnboardingStatus {
  completed: boolean;
  percentage: number;
  completed_step_count: number;
  total_step_count: number;
  next_step: {
    key: string;
    label: string;
    description: string;
    cta: string;
  } | null;
  steps: OnboardingStep[];
  updated_at: string;
}

export interface RecommendationCard {
  key: string;
  title: string;
  body: string;
  cta: string;
  category: 'onboarding' | 'activation' | 'engagement' | 'retention' | 'growth';
  priority: number;
  metadata?: Record<string, unknown>;
}

export interface SendaScores {
  stage: SendaStage;
  activation_score: number;
  engagement_score: number;
  conversion_score: number;
  churn_risk_score: number;
  last_active_at?: string | null;
  last_computed_at?: string | null;
  updated_at?: string;
}

interface SendaEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function fetchSenda<T>(path: string): Promise<T | null> {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as SendaEnvelope<T>;
    if (!json.success) return null;
    return json.data;
  } catch {
    return null;
  }
}

export function useSendaOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationCard[]>([]);
  const [scores, setScores] = useState<SendaScores | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [statusRes, recsRes, scoresRes] = await Promise.all([
      fetchSenda<OnboardingStatus>(API_CONFIG.ENDPOINTS.SENDA.ONBOARDING.STATUS),
      fetchSenda<RecommendationCard[] | { items: RecommendationCard[] }>(
        API_CONFIG.ENDPOINTS.SENDA.RECOMMENDATIONS,
      ),
      fetchSenda<SendaScores>(API_CONFIG.ENDPOINTS.SENDA.SCORES),
    ]);
    setStatus(statusRes);
    if (Array.isArray(recsRes)) setRecommendations(recsRes);
    else if (recsRes && Array.isArray((recsRes as { items: RecommendationCard[] }).items)) {
      setRecommendations((recsRes as { items: RecommendationCard[] }).items);
    } else {
      setRecommendations([]);
    }
    setScores(scoresRes);
    setIsLoading(false);
  }, []);

  const completeStep = useCallback(
    async (stepKey: string, metadata?: Record<string, unknown>) => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      try {
        await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SENDA.ONBOARDING.COMPLETE_STEP}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ step_key: stepKey, metadata: metadata ?? {} }),
          },
        );
        await load();
      } catch {
        /* graceful: backend may not be deployed */
      }
    },
    [load],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { status, recommendations, scores, isLoading, refetch: load, completeStep };
}

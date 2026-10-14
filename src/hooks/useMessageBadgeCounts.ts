import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Counts for the Outbox (failed), Sent and Scheduled badges, shared by the sidebar and the messages
 * sub-navigation.
 *
 * Each page mounts its own sidebar, so these used to be fetched on every page change: three full message
 * list requests (with their serializers and pagination counts) just to read each response's `count`,
 * and twice on the dashboard (loading skeleton, then the page). Now they are one cached query: remounts
 * reuse it while it is fresh, and each request asks for a single row because only the count is used.
 */
export function useMessageBadgeCounts() {
  const { isAuthenticated } = useAuth();

  const { data } = useQuery({
    queryKey: ['sms', 'badge-counts'],
    queryFn: async () => {
      const [failed, sent, scheduled] = await Promise.all([
        apiClient.getSMSMessages({ status: 'failed', page: 1, page_size: 1 }),
        apiClient.getSMSMessages({ status__in: 'sent,delivered', page: 1, page_size: 1 }),
        apiClient.getSMSMessages({ status: 'scheduled', page: 1, page_size: 1 }),
      ]);
      return {
        outboxCount: failed.success && failed.data ? failed.data.count || 0 : 0,
        sentCount: sent.success && sent.data ? sent.data.count || 0 : 0,
        scheduledCount: scheduled.success && scheduled.data ? scheduled.data.count || 0 : 0,
      };
    },
    enabled: isAuthenticated,
    staleTime: 30_000, // a send/retry/cancel shows in the badges within 30 s of the next page change
  });

  return {
    outboxCount: data?.outboxCount ?? 0,
    sentCount: data?.sentCount ?? 0,
    scheduledCount: data?.scheduledCount ?? 0,
  };
}

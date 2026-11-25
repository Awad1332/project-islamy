'use client';
import { Badge } from './ui/badge';
import { useI18n } from '@/i18n';

type V = 'default' | 'secondary' | 'gold' | 'success' | 'warning' | 'danger' | 'outline';
const TONE: Record<string, V> = {
  PENDING: 'warning', CONFIRMED: 'gold', PROCESSING: 'gold', SHIPPED: 'secondary', DELIVERED: 'success', CANCELLED: 'danger',
  UNPAID: 'warning', PAID: 'success', PARTIALLY_REFUNDED: 'secondary', REFUNDED: 'secondary',
  REQUESTED: 'warning', APPROVED: 'gold', REJECTED: 'danger', RECEIVED: 'secondary', COMPLETED: 'success',
  DRAFT: 'secondary', ACTIVE: 'success', ARCHIVED: 'outline', SCHEDULED: 'gold', SENDING: 'gold', SENT: 'success', FAILED: 'danger',
  NOT_CONFIGURED: 'outline', CONFIGURED: 'warning', VERIFIED: 'success', NOT_SENT: 'warning', QUEUED: 'secondary', SUCCEEDED: 'success',
  OPEN: 'gold', CLOSED: 'outline', TRIALING: 'gold', PAST_DUE: 'danger', CANCELED: 'outline', SKIPPED: 'secondary',
};

export function StatusBadge({ ns, value }: { ns: string; value: string }) {
  const { t } = useI18n();
  return <Badge variant={TONE[value] ?? 'secondary'}>{t(`${ns}.${value}`, value)}</Badge>;
}

import { errors } from '@strapi/utils';
import { formatLeadMessage, sendTelegram, telegramConfigured } from '../../utils/telegram';

interface LifecycleEvent {
  params: { data: Record<string, any> };
  result: Record<string, any>;
}

/** Normalises Ukrainian phone numbers to +380XXXXXXXXX. Returns null when the input is not a UA number. */
export const normalizeUaPhone = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '');
  if (/^380\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0\d{9}$/.test(digits)) return `+38${digits}`;
  return null;
};

const adminUrl = (documentId: string) =>
  `${(process.env.PUBLIC_URL || 'http://localhost:1337').replace(/\/$/, '')}/admin/content-manager/collection-types/api::lead.lead/${documentId}`;

export default {
  beforeCreate(event: LifecycleEvent) {
    const data = event.params.data;
    const phone = normalizeUaPhone(String(data?.phone ?? ''));
    if (!phone) throw new errors.ValidationError('Invalid Ukrainian phone number');
    data.phone = phone;
  },
  afterCreate(event: LifecycleEvent) {
    const lead = event.result;
    strapi.log.info(`[lead] new ${lead.type} lead ${lead.documentId}`);
    if (!telegramConfigured() || lead.status === 'spam') return;
    // Fire and forget: the visitor's request never waits for (or fails because of) Telegram.
    void sendTelegram(formatLeadMessage(lead, adminUrl(lead.documentId))).then((ok) => {
      if (!ok) strapi.log.error(`[lead] Telegram notification failed for ${lead.documentId}`);
    });
  },
};

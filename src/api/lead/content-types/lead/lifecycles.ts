import { errors } from '@strapi/utils';

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

export default {
  beforeCreate(event: LifecycleEvent) {
    const data = event.params.data;
    const phone = normalizeUaPhone(String(data?.phone ?? ''));
    if (!phone) throw new errors.ValidationError('Invalid Ukrainian phone number');
    data.phone = phone;
  },
  async afterCreate(event: LifecycleEvent) {
    // Telegram notification is implemented in feature 005 (leads).
    strapi.log.info(`[lead] new ${event.result.type} lead ${event.result.documentId}`);
  },
};

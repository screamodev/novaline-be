/**
 * Telegram notifications for new leads.
 * Configured by TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID; TELEGRAM_API_BASE is overridable for tests.
 */

export interface LeadForMessage {
  documentId?: string;
  type?: string;
  name?: string | null;
  phone?: string;
  reasonLabel?: string | null;
  message?: string | null;
  region?: string | null;
  district?: string | null;
  settlement?: string | null;
  neighbourhood?: string | null;
  street?: string | null;
  locale?: string | null;
  sourcePath?: string | null;
  context?: { label?: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
  connect: '🟣 Нове підключення',
  issue: '🟠 Питання / проблема',
  callback: '📞 Зворотний дзвінок',
};

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** +380XXXXXXXXX → 0XXXXXXXXX (how managers dial); anything else is shown as stored. */
export const localPhone = (phone: string) => (/^\+380\d{9}$/.test(phone) ? phone.slice(3) : phone);

/** Region → district → settlement → neighbourhood → street + house (the street field holds both, plus a flat if given). */
export const formatAddress = (lead: LeadForMessage) =>
  [lead.region, lead.district, lead.settlement, lead.neighbourhood, lead.street]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' → ');

/**
 * Builds the HTML message managers receive (Telegram `parse_mode=HTML`): only what is needed to call back.
 * The phone is in <code>, so a tap copies it.
 */
export function formatLeadMessage(lead: LeadForMessage): string {
  const line = (label: string, value?: string | null) => (value?.trim() ? `<b>${label}:</b> ${escapeHtml(value.trim())}` : null);
  return [
    `<b>${TYPE_LABEL[lead.type ?? ''] ?? 'Заявка'}</b>`,
    line('Імʼя', lead.name),
    lead.phone ? `<b>Телефон:</b> <code>${escapeHtml(localPhone(lead.phone))}</code>` : null,
    line('Тема', lead.reasonLabel),
    line('Адреса', formatAddress(lead)),
    line('Обрано', lead.context?.label),
    line('Коментар', lead.message),
  ]
    .filter(Boolean)
    .join('\n');
}

export const telegramConfigured = () => !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

/** Sends a message; resolves to false (never throws) when Telegram is unreachable or not configured. */
export async function sendTelegram(text: string, timeoutMs = 5000): Promise<boolean> {
  if (!telegramConfigured()) return false;
  const base = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

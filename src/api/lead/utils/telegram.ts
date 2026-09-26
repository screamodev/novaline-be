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

/** Builds the HTML message managers receive (Telegram `parse_mode=HTML`). */
export function formatLeadMessage(lead: LeadForMessage, adminUrl?: string): string {
  const line = (label: string, value?: string | null) => (value ? `<b>${label}:</b> ${escapeHtml(value)}` : null);
  const address = [lead.settlement, lead.neighbourhood, lead.district, lead.region].filter(Boolean).join(', ');
  return [
    `<b>${TYPE_LABEL[lead.type ?? ''] ?? 'Заявка'}</b>`,
    line('Імʼя', lead.name),
    lead.phone ? `<b>Телефон:</b> <a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>` : null,
    line('Тема', lead.reasonLabel),
    line('Адреса', address),
    line('Контекст', lead.context?.label),
    line('Повідомлення', lead.message),
    line('Мова / сторінка', [lead.locale, lead.sourcePath].filter(Boolean).join(' · ')),
    adminUrl && lead.documentId ? `<a href="${escapeHtml(adminUrl)}">Відкрити в адмінці</a>` : null,
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

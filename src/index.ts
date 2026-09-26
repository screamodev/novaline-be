import type { Core } from '@strapi/strapi';

const LOCALES = [
  { code: 'uk', name: 'Ukrainian (uk)' },
  { code: 'en', name: 'English (en)' },
];
const DEFAULT_LOCALE = 'uk';
const FRONTEND_TOKEN_NAME = 'frontend-server';
const WEBHOOK_NAME = 'frontend-revalidate';
const PRIVATE_APIS = ['api::lead.lead'];

/** Content APIs the public role and the frontend token may read. */
const readActions = (strapi: Core.Strapi) =>
  Object.values(strapi.contentTypes)
    .filter((ct: any) => ct.uid.startsWith('api::') && !PRIVATE_APIS.includes(ct.uid))
    .flatMap((ct: any) => (ct.kind === 'singleType' ? [`${ct.uid}.find`] : [`${ct.uid}.find`, `${ct.uid}.findOne`]))
    .concat('api::coverage.coverage.tree');

async function ensureLocales(strapi: Core.Strapi) {
  const locales = strapi.plugin('i18n').service('locales');
  for (const locale of LOCALES) {
    if (!(await locales.findByCode(locale.code))) await locales.create(locale);
  }
  if ((await locales.getDefaultLocale()) !== DEFAULT_LOCALE) await locales.setDefaultLocale({ code: DEFAULT_LOCALE });
}

async function ensurePublicPermissions(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return;
  const permissions = strapi.db.query('plugin::users-permissions.permission');
  const existing = new Set(
    (await permissions.findMany({ where: { role: role.id } })).map((p: { action: string }) => p.action),
  );
  for (const action of readActions(strapi)) {
    if (!existing.has(action)) await permissions.create({ data: { action, role: role.id } });
  }
}

async function ensureFrontendToken(strapi: Core.Strapi) {
  const tokens = strapi.service('admin::api-token');
  const permissions = [...readActions(strapi), 'api::lead.lead.create'];
  const existing = await tokens.getByName(FRONTEND_TOKEN_NAME);

  if (existing) {
    // Keep the token in sync with content types added after it was created.
    const current = await strapi.db
      .query('admin::api-token-permission')
      .findMany({ where: { token: existing.id }, select: ['action'] });
    const have = new Set(current.map((p: { action: string }) => p.action));
    if (permissions.some((a) => !have.has(a))) {
      await tokens.update(existing.id, { permissions });
      strapi.log.info(`[bootstrap] Updated permissions of API token "${FRONTEND_TOKEN_NAME}"`);
    }
    return;
  }

  const token = await tokens.create({
    name: FRONTEND_TOKEN_NAME,
    description: 'Server-side token for novaline-fe (read content, create leads)',
    type: 'custom',
    lifespan: null,
    permissions,
  });
  strapi.log.warn(`[bootstrap] Created API token "${FRONTEND_TOKEN_NAME}". Put it into novaline-fe/.env as NUXT_STRAPI_TOKEN:`);
  strapi.log.warn(`[bootstrap] ${token.accessKey}`);
}

async function ensureRevalidateWebhook(strapi: Core.Strapi) {
  const frontendUrl = process.env.FRONTEND_URL;
  const secret = process.env.FRONTEND_REVALIDATE_SECRET;
  if (!frontendUrl || !secret) {
    strapi.log.warn('[bootstrap] FRONTEND_URL / FRONTEND_REVALIDATE_SECRET not set — revalidate webhook skipped');
    return;
  }
  const store = strapi.get('webhookStore');
  const url = `${frontendUrl.replace(/\/$/, '')}/api/revalidate`;
  const data = {
    name: WEBHOOK_NAME,
    url,
    headers: { 'x-revalidate-secret': secret },
    events: ['entry.create', 'entry.update', 'entry.delete', 'entry.publish', 'entry.unpublish', 'media.update', 'media.delete'],
    isEnabled: true,
  };
  const current = (await store.findWebhooks()).find((w: { name: string }) => w.name === WEBHOOK_NAME);
  if (!current) {
    strapi.get('webhookRunner').add(await store.createWebhook(data));
  } else if (current.url !== url || current.headers?.['x-revalidate-secret'] !== secret) {
    strapi.get('webhookRunner').update(await store.updateWebhook(current.id, data));
  }
}

function warnMissingTelegram(strapi: Core.Strapi) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    strapi.log.warn('[bootstrap] TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — lead notifications are disabled');
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureLocales(strapi);
    await ensurePublicPermissions(strapi);
    await ensureFrontendToken(strapi);
    await ensureRevalidateWebhook(strapi);
    warnMissingTelegram(strapi);
  },
};

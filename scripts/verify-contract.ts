/**
 * Verifies the REST contract (specs/001-content-model/contracts/rest-api.md) against a running Strapi.
 *
 *   STRAPI_URL=http://localhost:1337 STRAPI_TOKEN=<frontend-server token> npm run verify:contract [-- --write]
 *
 * `--write` also creates one test lead (W1) with the token; it is marked as spam so managers can ignore it.
 */
const BASE = (process.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '') + '/api';
const TOKEN = process.env.STRAPI_TOKEN ?? '';
const WRITE = process.argv.includes('--write');

type Check = { id: string; path: string; expect: (body: any) => string | null };

const list = (min: number) => (b: any) => (Array.isArray(b.data) && b.data.length >= min ? null : `expected ≥ ${min} items`);
const single = (field: string) => (b: any) => (b.data && field in b.data ? null : `missing field "${field}"`);

const today = new Date().toISOString().slice(0, 10);
const READS: Check[] = [
  { id: 'R1', path: '/global?populate[phones]=true&populate[socials]=true&populate[defaultSeo][populate]=ogImage&populate[logo]=true', expect: single('phones') },
  { id: 'R2', path: '/home-page?populate[hero][populate]=image&populate[about][populate]=stats&populate[seo][populate]=ogImage', expect: single('hero') },
  { id: 'R3', path: '/services?sort=order:asc', expect: list(6) },
  { id: 'R4', path: '/plans?sort=order:asc&populate=features&pagination[pageSize]=100', expect: list(9) },
  { id: 'R5', path: '/addons?sort=order:asc', expect: list(5) },
  { id: 'R6', path: '/tv-packages?sort=order:asc&populate=features', expect: list(3) },
  { id: 'R7', path: '/tv-categories?sort=order:asc', expect: list(7) },
  { id: 'R8', path: '/tv-channels?sort=order:asc&populate=category&pagination[pageSize]=500', expect: list(40) },
  { id: 'R9', path: `/promos?sort=order:asc&filters[validUntil][$gte]=${today}`, expect: list(0) },
  { id: 'R10a', path: '/dc-services?sort=order:asc', expect: list(7) },
  { id: 'R10b', path: '/dc-facts?sort=order:asc', expect: list(4) },
  { id: 'R11', path: '/shop-items?sort=order:asc&populate=image', expect: list(6) },
  { id: 'R12', path: '/payment-methods?sort=order:asc&populate=steps', expect: list(5) },
  { id: 'R13', path: '/payment-details?populate=items', expect: single('items') },
  { id: 'R14', path: '/articles?sort=publishedDate:desc&populate[category]=true&populate[cover]=true&pagination[pageSize]=12', expect: list(6) },
  { id: 'R16', path: '/article-categories?sort=order:asc', expect: list(6) },
  {
    id: 'R17',
    path: '/coverage?locale=en',
    expect: (b) => (b.data?.settlementCount > 0 && Array.isArray(b.data.regions) ? null : 'empty coverage tree'),
  },
  { id: 'R19', path: '/assistant-settings?populate=*', expect: single('greeting') },
  { id: 'R20', path: '/radio?populate=*', expect: single('streams') },
  { id: 'R21', path: '/privacy-page?populate[seo][populate]=ogImage', expect: single('body') },
];

async function call(path: string, init: RequestInit = {}, auth = true): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth && TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(BASE + path, { ...init, headers });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function main() {
  const failures: string[] = [];
  const report = (id: string, ok: boolean, detail = '') => {
    console.log(`${ok ? '✔' : '✘'} ${id} ${detail}`);
    if (!ok) failures.push(id);
  };

  for (const check of READS) {
    const { status, body } = await call(check.path);
    const problem = status === 200 ? check.expect(body) : `HTTP ${status}`;
    report(check.id, !problem, problem ?? '');
  }

  // R15 / R18: lookup by slug using the first article / settlement.
  const article = (await call('/articles?pagination[pageSize]=1')).body?.data?.[0];
  const r15 = await call(`/articles?filters[slug][$eq]=${article?.slug}&populate=*`);
  report('R15', r15.status === 200 && r15.body.data.length === 1);
  const r18 = await call('/settlements?filters[slug][$eq]=kharkiv&populate[district][populate]=region&populate[neighbourhoods]=true');
  report('R18', r18.status === 200 && r18.body.data[0]?.district?.region?.slug === 'kharkivska');

  // EN locale is served.
  const en = await call('/plans?locale=en&pagination[pageSize]=1');
  report('i18n-en', en.status === 200 && en.body.data[0]?.locale === 'en');

  // Leads are private.
  report('W1-public-read', (await call('/leads', {}, false)).status === 403, '(public GET /leads → 403)');
  const lead = { data: { type: 'callback', phone: '+380000000000', name: 'contract-test', status: 'spam' } };
  report('W1-public-create', (await call('/leads', { method: 'POST', body: JSON.stringify(lead) }, false)).status === 403, '(public POST /leads → 403)');
  if (WRITE) {
    const created = await call('/leads', { method: 'POST', body: JSON.stringify(lead) });
    report('W1-token-create', created.status === 201, `(HTTP ${created.status})`);
  }

  console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll contract checks passed');
  process.exit(failures.length ? 1 : 0);
}

main();

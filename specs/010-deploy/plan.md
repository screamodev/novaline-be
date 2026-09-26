# Implementation Plan: Production Deployment

**Spec**: [spec.md](./spec.md) · **Status**: Implemented 2026-09-27, verified locally with production images behind Caddy

## Layout on the server

```
/opt/novaline/
  novaline-be/            ← this repo; deploy files in deploy/
    .env                  ← Strapi secrets
    deploy/.env           ← DOMAIN, CMS_DOMAIN, SITE_ENV, CADDY_NETWORK, DB password
  novaline-fe/            ← built as ../../novaline-fe
    .env                  ← NUXT_STRAPI_TOKEN, revalidate secret, OpenAI key
```

## Decisions

- **Networks**: `internal` for db/cms/web; cms and web also join the external Caddy network under unique aliases `novaline-cms` / `novaline-web` (the service names `web`/`cms` are too generic for a shared network). No host ports.
- **Start order**: `web` waits for `cms` to be healthy (`/_health`), closing the IPX first-request race seen in dev.
- **Webhook**: Strapi → `http://web:3000/api/revalidate` over the internal network.
- **Strapi behind proxy**: `PUBLIC_URL=https://${CMS_DOMAIN}`, `IS_PROXIED=true`.
- **Seed in production**: `tsx` moved to dependencies so `npm run seed` works inside the pruned image.
- **Frontend token**: created by bootstrap on first start and printed once to the log (two-step first start, DEPLOY.md §5).
- **Staging**: `NUXT_SITE_ENV=staging` → robots `Disallow: /` + `X-Robots-Tag: noindex` from Caddy.
- **Backups**: `pg_dump --format=custom` + tar of the uploads volume, 14-day rotation; `restore.sh` asks for confirmation.
- **Legacy URLs**: `novaline-fe/server/middleware/legacy-redirects.ts` (map in `shared/utils/legacy-redirects.ts`, from the old site's sitemap).
- **CI**: GitHub Actions in both repos (fe: typecheck, test, lint:colors, build; be: build, test).

## Files

`deploy/docker-compose.prod.yml`, `deploy/.env.example`, `deploy/Caddyfile.snippet`, `deploy/backup.sh`, `deploy/restore.sh`, `deploy/DEPLOY.md`, `config/server.ts`, `.github/workflows/ci.yml`.

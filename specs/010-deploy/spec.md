# Feature Specification: Production Deployment

**Feature Branch**: `010-deploy`

**Created**: 2026-09-26

**Status**: Implemented (2026-09-27), awaiting first server deploy

**Input**: User description: "Pack everything in Docker and deploy to the VPS behind the existing Caddy reverse proxy, like devquorum: main domain → Nuxt, cms subdomain → Strapi."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operator deploys a new version (Priority: P1)

The operator pulls both repos on the VPS, sets `.env` files from the checklist and runs one compose command; Nuxt, Strapi and Postgres start, join the Caddy network, and the site is reachable over HTTPS on the domain and `cms.` subdomain.

**Independent Test**: Fresh VPS dry-run: from clone to working HTTPS site in < 30 min following `quickstart.md`.

**Acceptance Scenarios**:

1. **Given** a new commit, **When** `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` runs, **Then** containers are replaced with < 10 s downtime for the site.
2. **Given** a container crash, **Then** it restarts automatically (`restart: unless-stopped`) and healthchecks report status.

---

### User Story 2 - Data is safe (Priority: P1)

Nightly `pg_dump` and uploads archive are kept for 14 days; a documented restore procedure recreates the CMS on a new host.

### User Story 3 - Only intended surfaces are public (Priority: P1)

Postgres is not exposed; Strapi admin is reachable only via `cms.` over HTTPS; Nuxt → Strapi traffic stays on the internal Docker network.

### Edge Cases

- Caddy network name differs → configurable `CADDY_NETWORK` (as devquorum).
- Strapi migrations on upgrade → documented `npm run strapi -- upgrade` flow with a pre-upgrade backup.
- Memory limits on a small VPS → Nuxt 512 MB, Strapi 1 GB, Postgres 512 MB.

## Requirements *(mandatory)*

- **FR-001**: `novaline-be/deploy/docker-compose.prod.yml` (the parent folder is not versioned): no host ports for db/cms/web, `caddy_net` external network, env files per service, resource limits, healthchecks.
- **FR-002**: Caddyfile snippet: `{$DOMAIN}` → `web:3000` (compression, security headers, `www` → apex redirect), `cms.{$DOMAIN}` → `cms:1337`, uploads cache headers.
- **FR-003**: Env checklist (`.env.example` in each repo) with secret generation commands.
- **FR-004**: Backup script + cron example; restore doc.
- **FR-005**: Strapi webhook to `https://{DOMAIN}/api/revalidate` configured by seed/bootstrap from env.
- **FR-006**: Production `robots` indexing enabled only when `NUXT_PUBLIC_SITE_ENV=production`.

## Success Criteria *(mandatory)*

- **SC-001**: SSL Labs A, securityheaders.com ≥ A.
- **SC-002**: Restore from backup verified once before launch.

## Assumptions

- Domain: the site replaces novaline.net. Staging first on `dev.novaline.net` / `cms.dev.novaline.net` (noindex); switching is an env + Caddy change (DEPLOY.md §10). Old WordPress URLs are 301-redirected by the frontend.
- The VPS already runs Caddy in Docker (same as devquorum / pasteria-be).

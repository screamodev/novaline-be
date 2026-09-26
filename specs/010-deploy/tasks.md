# Tasks: Production Deployment

- [x] T001 Production compose (db/cms/web, internal + Caddy networks, healthchecks, limits, depends_on healthy)
- [x] T002 Env checklists (`deploy/.env.example`, per-repo `.env.example`), configurable env file paths
- [x] T003 Strapi `url`/`proxy` for running behind Caddy; `tsx` available in the production image for seeding
- [x] T004 Caddyfile snippet: staging + production blocks, security headers, immutable assets, www → apex, noindex on staging/CMS
- [x] T005 backup.sh / restore.sh (+ cron example)
- [x] T006 Legacy WordPress URL redirects (frontend middleware + unit test)
- [x] T007 DEPLOY.md: DNS → Caddy network → clone → env → first start (token, seed) → Caddy → checks → backups → updates → launch switch
- [x] T008 CI workflows in both repos
- [x] T009 Local dry run with production images behind a temporary Caddy: clean DB, token, seed, all routes 200, redirects, webhook, lead, assistant fallback, backup → wipe → restore
- [ ] T010 First deploy on the VPS (owner) and restore test there

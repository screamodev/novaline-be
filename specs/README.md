# Specs index (global numbering across both repos)

| # | Feature | Owner repo | Status |
|---|---|---|---|
| 001 | content-model — Strapi types, coverage tree, leads, seed, REST contract | novaline-be | ✅ implemented |
| 002 | foundation — tokens, shell, i18n, SEO base, BFF + cache | novaline-fe | ✅ implemented |
| 003 | landing-sections | novaline-fe | ✅ implemented |
| 004 | coverage — search, cascade, Leaflet map | novaline-fe (+be) | ✅ implemented |
| 005 | leads — lead form, callback, Telegram | novaline-fe (+be) | ✅ implemented |
| 006 | news — /news, /news/[slug] | novaline-fe | spec |
| 007 | locality-pages — /internet/[slug] | novaline-fe (+be) | spec |
| 008 | radio — /radio | novaline-fe | spec |
| 009 | ai-assistant — OpenAI via server route | novaline-fe (+be) | spec |
| 010 | deploy — prod compose, Caddy, backups | novaline-be | spec |

Constitution: `.specify/memory/constitution.md` (identical in both repos).
REST contract: `novaline-be/specs/001-content-model/contracts/rest-api.md`.

Open clarifications: 008 real stream URLs; 010 production domain.

## Implementation phases

1. Foundation — 001 + 002
2. Landing — 003
3. Conversion — 004 + 005
4. SEO pages — 006 + 007 + 008
5. AI & production — 009 + 010 + final audit

Dev stack: `docker compose -f docker-compose.dev.yml up` in `therecom/`.

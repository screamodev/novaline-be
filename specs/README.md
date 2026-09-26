# Specs index (global numbering across both repos)

| # | Feature | Owner repo | Status |
|---|---|---|---|
| 001 | content-model — Strapi types, coverage tree, leads, seed, REST contract | novaline-be | spec + plan + tasks |
| 002 | foundation — tokens, shell, i18n, SEO base, BFF + cache | novaline-fe | spec + plan + tasks |
| 003 | landing-sections | novaline-fe | spec |
| 004 | coverage — search, cascade, Leaflet map | novaline-fe (+be) | spec |
| 005 | leads — lead form, callback, Telegram | novaline-fe (+be) | spec |
| 006 | news — /news, /news/[slug] | novaline-fe | spec |
| 007 | locality-pages — /internet/[slug] | novaline-fe (+be) | spec |
| 008 | radio — /radio | novaline-fe | spec |
| 009 | ai-assistant — OpenAI via server route | novaline-fe (+be) | spec |
| 010 | deploy — prod compose, Caddy, backups | novaline-be | spec |

Constitution: `.specify/memory/constitution.md` (identical in both repos).
REST contract: `novaline-be/specs/001-content-model/contracts/rest-api.md`.

Open clarifications (run `/speckit-clarify`): 001 FR-007 plan set per settlement; 005 FR-007 privacy policy; 008 real stream URLs; 010 production domain.

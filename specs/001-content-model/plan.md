# Implementation Plan: CMS Content Model & Seed

**Branch**: `001-content-model` | **Date**: 2026-09-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-content-model/spec.md`

## Summary

Model every prototype section as Strapi 5 content types (single types for page-level copy, collections for repeatable offerings, a 4-level coverage hierarchy, a private `lead` collection), enable i18n (`uk` default + `en`), lock down permissions, add a publish webhook to the frontend, and ship an idempotent seed script that loads the prototype content in both locales. The REST contract in `contracts/rest-api.md` is the source of truth for frontend types.

## Technical Context

**Language/Version**: TypeScript 5, Node.js 22

**Primary Dependencies**: Strapi 5.55 (`@strapi/strapi`, `@strapi/plugin-users-permissions`, built-in i18n), `pg`

**Storage**: PostgreSQL 16 (Docker), local uploads in a volume

**Testing**: Seed smoke test (`npm run seed` twice → counts stable) + REST contract checks with `curl`/Node script (`scripts/verify-contract.ts`)

**Target Platform**: Linux container (node:22-alpine)

**Project Type**: Headless CMS (web service)

**Performance Goals**: Coverage tree < 200 ms p95 for 500 settlements; home payload < 150 KB

**Constraints**: Public role read-only; lead create only via dedicated token; no custom admin UI

**Scale/Scope**: ~25 content types/components, ~50 settlements now (hundreds later), 2 locales

## Constitution Check

| Principle | Gate | Status |
|---|---|---|
| I. Content in CMS | Every prototype string/number has a field (audit in quickstart) | ✅ planned |
| II. Tokens | N/A for backend (accent colours stored as enum keys, not hex) | ✅ |
| III. Fidelity | Field set mirrors prototype structures | ✅ |
| IV. SEO | `shared.seo` on page-level types; slugs; updatedAt for sitemap lastmod | ✅ |
| V. A11y | Image `alternativeText` required in guidelines | ✅ |
| VI. BFF | Public role read-only; lead create via server token only | ✅ |
| VII. Contracts | `contracts/rest-api.md` + generated types (`strapi ts:generate-types`) | ✅ |
| VIII. Simplicity | Built-in REST + i18n, no GraphQL, no custom plugins | ✅ |

## Project Structure

### Documentation (this feature)

```text
specs/001-content-model/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/rest-api.md
└── tasks.md
```

### Source Code (repository root)

```text
config/
├── plugins.ts            # i18n defaults (uk, en)
└── ...                   # admin/api/database/middlewares/server (existing)
src/
├── index.ts              # bootstrap: locales, public permissions, webhook, lead token
├── components/
│   ├── shared/           # seo, link, phone, feature-item, stat, label-value, step
│   └── sections/         # hero, trust-item, section-heading, about, speed-chip
├── api/
│   ├── global/  home-page/  payment-details/  assistant-settings/  radio/      # single types
│   ├── service/ plan/ addon/ tv-package/ tv-category/ tv-channel/ promo/
│   ├── article/ article-category/ dc-service/ dc-fact/ shop-item/ payment-method/
│   ├── region/ district/ settlement/ neighbourhood/
│   ├── coverage/         # custom GET /api/coverage (tree, no content type)
│   └── lead/             # collection + lifecycles.ts hook point
scripts/
├── seed.ts               # idempotent seed (strapi.documents API)
├── seed-data/            # uk.ts, en.ts, geo.ts extracted from the prototype
└── verify-contract.ts
types/generated/          # strapi ts:generate-types output (committed)
```

**Structure Decision**: Standard Strapi 5 layout; one custom route (`/api/coverage`) aggregates the geo hierarchy to avoid N+1 deep populate from the frontend.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Custom `/api/coverage` controller | One-request tree for search/selects/map | Deep `populate` across 4 levels is slow, verbose and leaks unpublished children handling to the client |

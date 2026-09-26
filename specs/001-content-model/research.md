# Research: CMS Content Model & Seed

## R1. Single type with components vs. dynamic zone for `home-page`
- **Decision**: Fixed named components per section (not a dynamic zone).
- **Rationale**: Section order is fixed by design; named fields give typed, predictable frontend view models and simpler admin UX.
- **Alternatives**: Dynamic zone (page builder) — flexible, but invites layouts the design does not support and complicates types.

## R2. Localisation of shared numeric fields
- **Decision**: Enable i18n per content type; mark numeric/structural fields `pluginOptions.i18n.localized: false` (price, order, coordinates, flags, modifiers).
- **Rationale**: One price for both locales; translators cannot desync numbers.

## R3. Coverage delivery
- **Decision**: Custom controller `GET /api/coverage?locale=` that loads published regions/districts/settlements/neighbourhoods with `strapi.documents(...).findMany` and returns a nested tree.
- **Rationale**: Single round trip; response easily cached by the frontend BFF.
- **Alternatives**: Deep populate on `region` — 4 levels, heavier payload, harder to filter drafts.

## R4. Plans vs. coverage pricing
- **Decision (provisional)**: Same plan set everywhere; `plan.availableForCoverage` marks which plans appear in the coverage result; price = base + neighbourhood modifier. Pending clarification FR-007.

## R5. Seed approach
- **Decision**: `scripts/seed.ts` run via `strapi console`-like programmatic boot (`createStrapi().load()`), using the Document Service; entries matched by stable `key`/`slug` fields; creates `uk` then `en` localisation of the same document; publishes.
- **Rationale**: Idempotent, uses public APIs, no raw SQL; stable keys allow re-runs without overwriting manual edits.
- **Alternatives**: `strapi import` tar — not diff-friendly, not idempotent against edits.

## R6. Webhook
- **Decision**: Configure on bootstrap via `strapi.get('webhookStore')` if absent: URL `${FRONTEND_URL}/api/revalidate`, header `x-revalidate-secret`, events `entry.publish|unpublish|update|delete|create`, `media.update|delete`.

## R7. Slugs
- **Decision**: `uid` fields; settlements transliterated with the official Ukrainian national transliteration (KMU 2010) via a small helper in seed; apostrophes dropped.

## R8. Lead access
- **Decision**: Public role has no lead permissions; bootstrap creates an API token "frontend-server" (custom type) with `find/findOne` on all content + `create` on lead.

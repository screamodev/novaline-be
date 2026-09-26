---
description: "Tasks for 001-content-model"
---

# Tasks: CMS Content Model & Seed

**Input**: `/specs/001-content-model/` (plan.md, spec.md, research.md, data-model.md, contracts/rest-api.md)

**Tests**: Contract verification script + seed idempotency check (no unit test suite requested).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Configure i18n locales `uk` (default) + `en` in `config/plugins.ts` and bootstrap locale creation in `src/index.ts`
- [ ] T002 [P] Add `tsx` dev dependency and scripts `seed`, `verify:contract`, `types` (`strapi ts:generate-types`) in `package.json`
- [ ] T003 [P] Add transliteration helper (KMU 2010) in `scripts/lib/slugify-uk.ts`

## Phase 2: Foundational (blocking)

- [ ] T004 Create shared components (`seo`, `phone`, `social`, `feature`, `stat`, `label-value`, `step`) in `src/components/shared/*.json`
- [ ] T005 Create section components (`heading`, `hero`, `trust-item`, `coverage-copy`, `about`) in `src/components/sections/*.json`
- [ ] T006 Create `global` single type in `src/api/global/` with fields per data-model
- [ ] T007 Bootstrap public-role read permissions for all content APIs except `lead` in `src/index.ts`
- [ ] T008 Bootstrap "frontend-server" API token (read all + create lead) if absent, print once, in `src/index.ts`
- [ ] T009 Bootstrap revalidate webhook from `FRONTEND_URL` / `FRONTEND_REVALIDATE_SECRET` in `src/index.ts`

**Checkpoint**: admin boots with locales, permissions, token, webhook.

## Phase 3: US1 — Plans & prices (P1) 🎯 MVP

- [ ] T010 [P] [US1] `plan` collection (segment enum, nullable price, features, availableForCoverage) in `src/api/plan/`
- [ ] T011 [P] [US1] `addon` collection in `src/api/addon/`
- [ ] T012 [US1] Lifecycle validation: `price` null ⇒ `priceLabel` required in `src/api/plan/content-types/plan/lifecycles.ts`
- [ ] T013 [US1] Seed plans (9) + addons (5) uk/en in `scripts/seed-data/{uk,en}.ts` and `scripts/seed.ts`

## Phase 4: US2 — Coverage geography (P1)

- [ ] T014 [P] [US2] `region`, `district`, `settlement`, `neighbourhood` collections with relations in `src/api/*/`
- [ ] T015 [US2] Custom route + controller `GET /api/coverage` returning the tree + `settlementCount` in `src/api/coverage/`
- [ ] T016 [US2] Public permission for `coverage.tree` in `src/index.ts`
- [ ] T017 [US2] Seed geo (4 regions, 12 districts, 46 settlements with coords + isRegionalCentre, neighbourhoods) from prototype in `scripts/seed-data/geo.ts`

## Phase 5: US5 — Leads (P1)

- [ ] T018 [US5] `lead` collection (no D&P, no i18n, status enum) in `src/api/lead/`
- [ ] T019 [US5] Lifecycle `afterCreate` hook stub (logs; Telegram in feature 005) + phone re-validation `beforeCreate` in `src/api/lead/content-types/lead/lifecycles.ts`

## Phase 6: US6 — Seed & idempotency (P1)

- [ ] T020 [US6] Seed runner: boot Strapi programmatically, upsert-by-key for each type, create `en` localisation, publish; summary "created/skipped" in `scripts/seed.ts`
- [ ] T021 [US6] Upload hero image + logo into media library during seed (skip if present) in `scripts/seed.ts`

## Phase 7: US3 — Section copy & SEO (P2)

- [ ] T022 [US3] `home-page` single type composed of section components in `src/api/home-page/`
- [ ] T023 [US3] Seed global + home-page uk/en

## Phase 8: US4 — Other collections (P2)

- [ ] T024 [P] [US4] `service` collection
- [ ] T025 [P] [US4] `tv-package`, `tv-category`, `tv-channel`
- [ ] T026 [P] [US4] `promo`
- [ ] T027 [P] [US4] `article-category`, `article` (blocks body, slug, seo)
- [ ] T028 [P] [US4] `dc-service`, `dc-fact`, `shop-item`
- [ ] T029 [P] [US4] `payment-method`, `payment-details`
- [ ] T030 [P] [US4] `assistant-settings`, `radio` single types
- [ ] T031 [US4] Seed all of the above uk/en (news ×6 with short bodies, radio streams as placeholders flagged in admin description)

## Phase 9: Polish

- [ ] T032 Generate types `types/generated/*` and commit
- [ ] T033 `scripts/verify-contract.ts` checking R1–R20, W1 (201 with token, 403 public)
- [ ] T034 Run quickstart end-to-end on an empty DB volume; tick content audit
- [ ] T035 Update `README.md` with seed/token instructions

## Dependencies

Setup → Foundational → (US1, US2, US5 in parallel) → US6 seed runner (needs types) → US3, US4 → Polish.
Seed data files (T013, T017, T023, T031) can be written in parallel with type definitions.

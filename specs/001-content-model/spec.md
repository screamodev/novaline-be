# Feature Specification: CMS Content Model & Seed

**Feature Branch**: `001-content-model`

**Created**: 2026-09-26

**Status**: Draft

**Input**: User description: "Strapi is responsible for managing all dynamic content on the NovaLine landing. Model every section of the Claude Design prototype (Direction 1) as editable content in UA and EN, including coverage geography with neighbourhood price modifiers, and seed it with the prototype content."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marketing manager edits plans and prices (Priority: P1)

A content manager logs into the Strapi admin, opens "Plans", changes the price of "Максимум 1000 Мбіт/с" from 270 to 290, publishes, and the live site shows the new price within a minute — in both the plan cards and the coverage result.

**Why this priority**: Prices and plans are the most frequently changed, highest-value content of an ISP site; editing them without a developer is the core reason for the CMS.

**Independent Test**: Edit a plan in the admin, call the public REST endpoint, confirm the new value and locale variants are returned.

**Acceptance Scenarios**:

1. **Given** the seeded CMS, **When** the manager edits and publishes a plan price, **Then** `GET /api/plans?locale=uk` returns the new price and a publish webhook fires.
2. **Given** a plan saved as draft only, **When** the public API is queried, **Then** the draft is not returned.
3. **Given** the UA entry exists, **When** the manager creates the EN localisation, **Then** `?locale=en` returns the EN copy while non-localised fields (price, order, popular flag) stay shared.

---

### User Story 2 - Manager maintains coverage geography (Priority: P1)

The manager adds a new settlement "Малинівка" under "Чугуївський район / Харківська область" with map coordinates, marks it as a regional centre or not, optionally adds neighbourhoods with a price modifier (e.g. "Центр +30 грн"), and it immediately appears in the site search, cascading selectors, map and sitemap.

**Why this priority**: Coverage lookup is the primary conversion path on the landing; the network grows constantly.

**Independent Test**: Create region → district → settlement → neighbourhood in admin; `GET /api/coverage` returns the nested tree including the new nodes with coordinates and modifiers.

**Acceptance Scenarios**:

1. **Given** a published settlement with coordinates, **When** the coverage tree is requested, **Then** it appears under its district with `lat`, `lng`, `isRegionalCentre`, `slug`.
2. **Given** a settlement with neighbourhoods, **When** requested, **Then** each neighbourhood returns its localised name and integer `priceModifier` (may be negative).
3. **Given** a settlement is unpublished, **When** requested, **Then** it is absent from the tree.

---

### User Story 3 - Manager edits section copy and SEO (Priority: P2)

The manager changes the hero headline, the promo badge, trust-strip items, about-us text and stats, and the page SEO title/description, in UA and EN.

**Why this priority**: Required for "all content in CMS", but changes less often than plans/coverage.

**Independent Test**: Edit `home-page` single type; `GET /api/home-page?locale=en&populate=…` returns updated component fields.

**Acceptance Scenarios**:

1. **Given** the home page single type, **When** the hero title is edited and published, **Then** the API returns it and the site shows it after cache purge.
2. **Given** SEO fields are empty, **When** the API is queried, **Then** the global default SEO is returned by the frontend fallback (contract documents the fallback rule).

---

### User Story 4 - Manager publishes news, promos, TV, data-centre, shop, payment content (Priority: P2)

The manager creates a news article with slug, cover and rich text; adds/expires promos with a validity date; edits TV packages and the channel list; data-centre services; shop items; payment methods with step lists and bank details.

**Independent Test**: For each collection, create an entry and fetch it via REST with the documented `populate`/`sort` parameters.

**Acceptance Scenarios**:

1. **Given** a promo whose `validUntil` is in the past, **When** the promo list is requested with the documented filter, **Then** it is excluded.
2. **Given** a news article, **When** fetched by slug and locale, **Then** title, excerpt, category, publish date, cover and body blocks are returned.
3. **Given** TV channels with category and tier, **When** listed, **Then** they are sortable by `order` and filterable by category.

---

### User Story 5 - Leads are stored and cannot be read publicly (Priority: P1)

Form submissions (connection request, issue report, callback) are stored in a `lead` collection, visible to managers with a processing status, and are never readable through the public API.

**Independent Test**: Create a lead with the frontend API token; attempt `GET /api/leads` with the public role → 403; admin sees the entry.

**Acceptance Scenarios**:

1. **Given** the frontend server token with create-only permission on `lead`, **When** it posts a valid lead, **Then** it is stored with status `new`.
2. **Given** the public role, **When** it requests leads, **Then** it gets 403.
3. **Given** a new lead is created, **When** the lifecycle hook runs, **Then** a Telegram notification is sent (implemented in feature 005; this feature only defines the hook point).

---

### User Story 6 - Fresh environment starts with prototype content (Priority: P1)

A developer runs `docker compose up` on an empty database and the seed script fills every type with the prototype content in UA and EN, creating roles, permissions and an API token.

**Independent Test**: Drop the DB volume, start the stack, run seed; the frontend renders identically to the prototype. Running seed twice creates no duplicates.

**Acceptance Scenarios**:

1. **Given** an empty DB, **When** the seed runs, **Then** all content from the prototype exists in both locales and is published.
2. **Given** a seeded DB, **When** the seed runs again, **Then** no duplicates are created and manual edits are not overwritten (seed only creates missing entries, matched by stable keys/slugs).

### Edge Cases

- Settlement names with apostrophes (`Дубов’язівка`) must produce valid, stable slugs (transliterated: `duboviazivka`, KMU 2010).
- Same settlement name in two districts → slug is disambiguated (`name-district`).
- A plan with non-numeric price ("договірна" / "on request") → modelled as `price: null` + localised `priceLabel`.
- Neighbourhood modifier may be negative (Салтівка −10).
- Data-centre service without price → `price: null` renders "за запитом".
- EN localisation missing for an entry → API returns nothing for `en`; frontend falls back to UA (rule in contract).
- Media deleted while referenced → frontend must tolerate `null` images.

## Clarifications

### Session 2026-09-26

- Q: Does the plan set differ per settlement? → A: No. One plan set (`availableForCoverage`), price = base + neighbourhood modifier.
- Q: Real contacts in seed? → A: Seed prototype values, marked as placeholders in admin.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide Strapi i18n with locales `uk` (default) and `en`; all human-readable fields are localised, numeric/structural fields (price, order, coordinates, flags) are shared across locales.
- **FR-002**: System MUST provide a `global` single type: brand tagline, phones (list with display + tel value, primary flag, Viber flag), email, social links, personal-account URL, radio link visibility, footer copyright, default SEO, organisation data for schema.org (legal name, address, founding year).
- **FR-003**: System MUST provide a `home-page` single type composed of section components: hero (kicker, title line 1/2, subtitle, promo text, CTA labels, image, speed chip), trust strip (4 items: icon key, title, text), and headers (kicker/title/subtitle) for coverage, services, plans, addons, TV, promos, data-centre, shop, payment, news, about, lead sections; about paragraphs and 4 stats; plans connection note; shop router note; payment account note; SEO component.
- **FR-004**: System MUST provide collections: `service` (icon key, title, description, order), `plan` (segment: private|apartment|business, name, speedLabel, price, priceLabel, period label, popular, features[], order, `availableForCoverage` flag), `addon` (title, description, price, priceLabel, unit, highlighted, order), `tv-package` (name, channelsLabel, price, popular, features[], order), `tv-category` (name, order), `tv-channel` (name, category, tier: min|mid|max, order), `promo` (title, tag, description, terms, validUntil, accent: violet|coral, order), `article` (title, slug, excerpt, category, cover, body blocks, publishedDate, SEO), `article-category`, `dc-service` (title, description, price|null, unit, order), `dc-fact` (title, text, order), `shop-item` (name, category label, description, price, image, order), `payment-method` (name, meta, steps[], order), single `payment-details` (items: label/value).
- **FR-005**: System MUST model coverage as `region` → `district` → `settlement` → `neighbourhood`: settlement has name, slug, lat, lng, isRegionalCentre, optional SEO intro text for its locality page; neighbourhood has name and integer `priceModifier` (UAH).
- **FR-006**: System MUST expose a single read endpoint returning the full published coverage tree (for search, cascading selects and map) in one request, localised.
- **FR-007**: The coverage result MUST show the same plan set everywhere: plans flagged `availableForCoverage`, priced as base price + the selected neighbourhood's `priceModifier` (0 when the settlement has no neighbourhoods). Per-settlement plan sets are out of scope.
- **FR-008**: System MUST provide a `lead` collection (not localised): type (connect|issue|callback), name, phone, reason, message, location (region/district/settlement/neighbourhood text), locale, source page, status (new|in_progress|done|spam), createdAt; public read is forbidden; a dedicated API token has create-only permission.
- **FR-009**: System MUST provide `assistant-settings` single type (system prompt addendum, greeting, quick questions[], offline fallback answers with keywords) and `radio` single type (title, subtitle, genres[], streams[]: label, bitrate, url, now-playing labels).
- **FR-010**: Public role MUST have `find`/`findOne` on all content types except `lead`; no write permissions.
- **FR-011**: System MUST call a configurable webhook (`FRONTEND_URL/api/revalidate` with secret header) on publish/unpublish/update/delete of any content entry.
- **FR-012**: System MUST ship an idempotent seed (`npm run seed`) with all prototype content in UA + EN, matched by stable keys, creating the frontend API token if absent and printing it once.
- **FR-013**: Every page-level type (home-page, article, settlement) MUST include a reusable `shared.seo` component (metaTitle, metaDescription, ogImage, noIndex).
- **FR-014**: The REST contract (endpoints, populate params, response shapes, fallback rules) MUST be documented in `contracts/` and treated as the source of truth for frontend types.

### Key Entities

- **Global**: site-wide contacts, links, organisation facts, default SEO.
- **HomePage**: ordered section components with localised copy.
- **Plan / Addon**: priced offerings by segment; addons apply to any plan.
- **TvPackage / TvCategory / TvChannel**: OTT offering; channel belongs to one category and a minimum tier.
- **Promo**: time-limited offer with terms.
- **Article / ArticleCategory**: news & advice content with slug and SEO.
- **DcService / DcFact**: data-centre offering and site facts.
- **ShopItem**: equipment for sale.
- **PaymentMethod / PaymentDetails**: step-by-step instructions and bank details.
- **Region → District → Settlement → Neighbourhood**: coverage hierarchy with coordinates and price modifiers.
- **Lead**: inbound request from the site; private.
- **AssistantSettings**, **Radio**: configuration for features 009 and 008.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of text and numbers visible in the prototype are editable in the admin (audit checklist in `quickstart.md`).
- **SC-002**: A price change is visible on the live site within 60 s of publishing, without a deploy.
- **SC-003**: A new settlement can be added by a non-developer in under 3 minutes.
- **SC-004**: Seed on an empty DB completes in under 60 s and is safe to re-run (0 duplicates).
- **SC-005**: Coverage tree endpoint responds in < 200 ms (p95) for 500 settlements.
- **SC-006**: 0 public endpoints expose lead data.

## Assumptions

- Strapi 5 built-in i18n and Content Manager are sufficient; no custom admin UI.
- Settlement coordinates are entered manually (seed provides prototype coordinates).
- Contacts and bank details are seeded from the prototype (phones, email, IBAN/EDRPOU placeholders); their admin field descriptions mark them as placeholders for the manager to replace.
- Media is stored locally in a Docker volume; ~hundreds of images at most.
- Frontend consumes REST (not GraphQL).

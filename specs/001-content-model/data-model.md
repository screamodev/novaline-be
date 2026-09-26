# Data Model: CMS Content Model

Legend: **L** = localised (uk/en), **S** = shared across locales. All collections have `order: integer (S)` unless noted. Draft & Publish enabled on everything except `lead`.

## Components

| Component | Fields |
|---|---|
| `shared.seo` | metaTitle (L, ≤ 70), metaDescription (L, ≤ 170), ogImage (media, S), noIndex (bool, S) |
| `shared.phone` | display (S, "+38 (098) 506 06 09"), tel (S, "+380985060609"), primary (bool), viber (bool) |
| `shared.social` | network (enum: instagram, telegram, facebook, youtube, viber), url |
| `shared.feature` | text (L) |
| `shared.stat` | value (S, "2003"), label (L), tone (enum: glass, coral, violet) |
| `shared.label-value` | label (L), value (L) |
| `shared.step` | text (L) |
| `sections.heading` | kicker (L), title (L), subtitle (L, optional) |
| `sections.hero` | kicker (L), titleLine1 (L), titleLine2 (L), subtitle (L), promoText (L), primaryCta (L), secondaryCta (L), image (media), imageAlt (L), speedValue (S, "1000"), speedUnit (L), speedCaption (L) |
| `sections.trust-item` | icon (enum: support, engineer, power, award), title (L), text (L) |
| `sections.coverage-copy` | heading (`sections.heading`), searchHint (L), resultTitle (L), technology (S, "GPON / EPON"), speedValue (L), hint (L, "Понад {count} населених пунктів…"), mapTitle (L), nodesCount (S, 300), legendCity (L), legendVillage (L), mapHint (L) |
| `sections.about` | heading, paragraphs (L, rich text blocks), stats (`shared.stat` ×4) |

## Single types

| Type | Fields |
|---|---|
| `global` | brandTagline (L), phones (`shared.phone`[]), email (S), socials (`shared.social`[]), cabinetUrl (S), footerTagline (L), copyright (L), currencyLabel (L, "грн"), perMonthLabel (L, "грн/міс"), defaultSeo (`shared.seo`), orgLegalName (L), orgFoundingYear (S), orgAreaServed (L), logo (media) |
| `home-page` | hero, trustItems (`sections.trust-item`[4]), coverage (`sections.coverage-copy`), services / plans / addons / tv / promos / dataCentre / shop / payment / news / lead (`sections.heading` each), plansConnectionNote (L), tvChips (`shared.feature`[]), tvChannelsNote (L), shopRouterNote (L), shopOrderNote (L), paymentAccountNote (L), paymentStepsTitle (L), paymentDetailsTitle (L), about (`sections.about`), seo (`shared.seo`) |
| `payment-details` | items (`shared.label-value`[]) |
| `assistant-settings` | title (L), subtitle (L), greeting (L), quickQuestions (`shared.feature`[]), promptAddendum (L, long text), fallbackMessage (L), fallbackReplies (component `assistant.reply`: keywords (L, comma list), answer (L)) |
| `radio` | title (L), subtitle (L), liveLabel (L), genres (`shared.feature`[]), nowPlayingTitle (L), nowPlayingArtist (L), streams (component `radio.stream`: label, bitrate, url), background (media), artwork (media), hint (L), seo |

## Collections

| Collection | Fields |
|---|---|
| `service` | key (uid, S), icon (enum: net, tv, install, consult, ip4, ip6), title (L), description (L) |
| `plan` | key (uid), segment (enum: private, apartment, business; S), name (L), speedLabel (L), price (decimal, S, nullable), priceLabel (L, used when price null or prefix "від"), periodLabel (L, "грн/міс" / "грн разово"), popular (bool), features (`shared.feature`[]), availableForCoverage (bool), coverageCaption (L, "Оптика в дім") |
| `addon` | key, title (L), description (L), price (decimal, nullable), priceLabel (L, "безкоштовно"), unitLabel (L), highlighted (bool) |
| `tv-package` | key, name (L), channelsLabel (S, "250+"), price (decimal), popular (bool), features (`shared.feature`[]) |
| `tv-category` | key, name (L) |
| `tv-channel` | name (S), category (→ tv-category), tier (enum: min, mid, max) |
| `promo` | key, title (L), tag (L), description (L), terms (L), validUntil (date, S), accent (enum: violet, coral) |
| `article-category` | name (L), slug (uid, L) |
| `article` | title (L), slug (uid, L), excerpt (L), category (→ article-category), cover (media), body (blocks, L), publishedDate (date, S), seo |
| `dc-service` | key, title (L), description (L), price (decimal, nullable), unitLabel (L) |
| `dc-fact` | key, title (L), text (L) |
| `shop-item` | key, name (S), categoryLabel (L), description (L), price (decimal), image (media, optional) |
| `payment-method` | key, name (L), meta (L), steps (`shared.step`[]) |
| `region` | name (L), slug (uid, S), districts (← district) |
| `district` | name (L), slug (uid, S), region (→ region) |
| `settlement` | name (L), nameLocative (L, for 007), slug (uid, S), lat (decimal), lng (decimal), isRegionalCentre (bool), district (→ district), intro (blocks, L, optional), seo |
| `neighbourhood` | name (L), priceModifier (integer, S, may be negative), settlement (→ settlement) |
| `lead` (no D&P, no i18n) | type (enum: connect, issue, callback), name, phone, reasonKey, reasonLabel, message (text), region, district, settlement, neighbourhood, locale, sourcePath, context (json: plan/promo/etc.), status (enum: new, in_progress, done, spam; default new), managerNote (text) |

## Relationships

```text
region 1─* district 1─* settlement 1─* neighbourhood
tv-category 1─* tv-channel
article-category 1─* article
```

## Validation rules

- `settlement.lat` ∈ [44, 53], `lng` ∈ [22, 41] (Ukraine bounds).
- `neighbourhood.priceModifier` ∈ [−500, 500].
- `plan.price` ≥ 0 or null; if null then `priceLabel` required (enforced in lifecycle `beforeCreate/Update`).
- `lead.phone` stored normalised `+380XXXXXXXXX` (validated by the frontend route, re-checked in lifecycle).

<!--
Sync Impact Report
- Version: 0.0.0 → 1.0.0 (initial ratification)
- Principles added: I–VIII
- Sections added: Technology Constraints, Development Workflow, Governance
- Templates: plan-template "Constitution Check" gates map to principles I–VIII ✅
- This file is kept byte-identical in novaline-fe and novaline-be.
-->

# NovaLine Constitution

Scope: the NovaLine ISP website — `novaline-fe` (Nuxt 4 SSR frontend) and `novaline-be` (Strapi 5 CMS).
Design source of truth: Claude Design prototype `NovaLine Direction 1.dc.html` (+ `Radio.dc.html`).

## Core Principles

### I. Content Lives in the CMS
Every piece of marketing or business content (section copy, plans, prices, TV packages, promos, news,
data-centre services, shop items, payment instructions, contacts, coverage geography, SEO fields)
MUST be editable in Strapi without a deploy. Only UI micro-copy (button labels, form labels, aria
text, validation messages) lives in frontend i18n JSON. Hardcoding content in Vue components is a defect.

### II. Design Tokens Are Constants
All colours are defined once in `novaline-fe/app/theme/colors.ts` and consumed through the Tailwind
theme (`tailwind.config.ts`) or imported constants (e.g. Leaflet markers). Components MUST NOT contain
raw hex/rgb values or arbitrary-value colour classes. Typography, radii, shadows, container width and
breakpoints likewise come from the Tailwind theme. Changing the brand palette MUST require editing one file.

### III. Pixel Fidelity to the Prototype
Layouts, spacing, typography and interaction states follow the prototype at 1280px and at each
prototype breakpoint (520/640/720/820/980/1080). Deviations require an explicit note in the feature
spec. Prototype-only artefacts (inline `style` strings, `sc-*` tags, CDN Leaflet) are not copied.

### IV. SEO Is a Requirement, Not a Polish Step
- Every public page is server-rendered with complete HTML (content visible without JS).
- Exactly one `<h1>` per page; semantic landmarks (`header`, `nav`, `main`, `section`, `footer`).
- Title, description, canonical, Open Graph and Twitter tags come from a Strapi SEO component with
  sensible fallbacks.
- `hreflang` for `uk-UA`, `en` and `x-default`; UA is served without prefix, EN under `/en`.
- `sitemap.xml` (including news and locality pages) and `robots.txt` are generated.
- Structured data (schema.org JSON-LD): Organization/LocalBusiness on all pages; Offer for plans;
  Article + BreadcrumbList for news; Service/Place for locality pages; FAQPage where Q&A exists.
- Performance budget (mobile, p75): LCP < 2.5 s, CLS < 0.1, INP < 200 ms. The hero image is
  optimised via `@nuxt/image` and preloaded; fonts are self-hosted via `@nuxt/fonts`; Leaflet and
  the chat widget load client-only and lazily.

### V. Accessibility (WCAG 2.2 AA)
Text contrast ≥ 4.5:1, touch targets ≥ 44px, full keyboard operability (menus, dialogs, accordions,
tabs, selects), visible focus, labelled form controls, `aria-expanded`/`aria-controls` on disclosures,
focus trap + Escape in dialogs/drawers, `prefers-reduced-motion` honoured.

### VI. Server-Side Boundary (BFF)
The browser never talks to Strapi with a privileged token. The frontend reads CMS data through Nuxt
server routes (`/api/cms/*`) that hold the Strapi token, normalise responses into typed view models and
cache them. Mutations (leads, callbacks, AI chat) go through Nuxt server routes that validate input
with zod, apply honeypot + rate limiting, and forward to Strapi / third parties. Secrets live only in env.

### VII. Type Safety & Contracts
TypeScript strict in both repos. The Strapi → frontend REST contract is documented in
`novaline-be/specs/001-content-model/contracts/` and mirrored by frontend types; a contract change
updates both sides in the same feature. No `any` in application code without a justification comment.

### VIII. Simplicity & Reproducibility
Prefer framework defaults and official modules over custom infrastructure. Everything runs with
`docker compose up --build` from `therecom/`. Seed data reproduces the prototype content (UA + EN)
idempotently so every environment starts in a known state. YAGNI: no feature beyond an approved spec.

## Technology Constraints

| Area | Choice |
|---|---|
| Frontend | Nuxt 4 (SSR), Vue 3, TypeScript strict, pnpm |
| Styling | Tailwind CSS v3 via `@nuxtjs/tailwindcss`, tokens from `app/theme/colors.ts` |
| i18n | `@nuxtjs/i18n`, `prefix_except_default`, locales `uk` (default) + `en` |
| SEO | `@nuxtjs/sitemap`, `@nuxtjs/robots`, `nuxt-schema-org`, `@nuxt/image`, `@nuxt/fonts` |
| Caching | Nitro `routeRules` SWR + cached server handlers; purged by Strapi webhook → `/api/revalidate` |
| CMS | Strapi 5 (TypeScript, npm), i18n plugin, PostgreSQL 16, local uploads in a Docker volume |
| Map | Leaflet + CARTO dark tiles, client-only |
| Notifications | Telegram Bot API from a Strapi lifecycle hook |
| AI assistant | OpenAI Chat Completions via a Nuxt server route; key from env (placeholder until provided) |
| Runtime | Docker (node:22-alpine), deployed behind the existing Caddy reverse proxy on a VPS |

## Development Workflow

1. Spec Kit flow per feature: `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` →
   `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
2. Feature numbers are global across both repos (001–0NN). A spec lives in the repo that owns the
   user-facing outcome; cross-repo tasks are labelled `[be]` / `[fe]` in `tasks.md`.
3. One branch per feature (`NNN-short-name`), PR into `main`. Conventional Commits.
4. Quality gates before merge: `pnpm build && pnpm typecheck` (fe), `npm run build` (be), stack boots
   with `docker compose up --build`, acceptance scenarios from the spec verified, Lighthouse
   SEO/A11y ≥ 95 and Performance ≥ 90 on mobile for pages touched.

## Governance

This constitution supersedes ad-hoc preferences. Every `plan.md` includes a Constitution Check against
principles I–VIII; violations must be listed in its Complexity Tracking table with justification.
Amendments: edit this file in both repos in the same change, bump the version (MAJOR: principle
removed/redefined, MINOR: principle/section added, PATCH: wording), and update the Sync Impact Report.

**Version**: 1.0.0 | **Ratified**: 2026-09-26 | **Last Amended**: 2026-09-26

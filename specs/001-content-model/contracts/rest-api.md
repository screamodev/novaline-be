# REST Contract: novaline-be → novaline-fe

Base: `${STRAPI_URL}/api`. Auth: `Authorization: Bearer ${NUXT_STRAPI_TOKEN}` (server-side only).
All reads accept `locale=uk|en`. Strapi 5 flat response format (`{ data, meta }`, documents with `documentId`).

## Locale fallback rule
If a localised request returns `data: null` (single type) or an entry is missing in `en`, the frontend BFF re-requests `locale=uk` and uses it. The BFF never mixes locales inside one entry.

## Reads

| # | Endpoint | Query | Returns |
|---|---|---|---|
| R1 | `GET /global` | `populate[phones]=true&populate[socials]=true&populate[defaultSeo][populate]=ogImage&populate[logo]=true` | Global |
| R2 | `GET /home-page` | `populate=*` for components + `populate[hero][populate]=image`, `populate[about][populate]=stats`, `populate[seo][populate]=ogImage` | HomePage |
| R3 | `GET /services` | `sort=order:asc&pagination[pageSize]=100` | Service[] |
| R4 | `GET /plans` | `sort=order:asc&populate=features&pagination[pageSize]=100` | Plan[] (all segments) |
| R5 | `GET /addons` | `sort=order:asc` | Addon[] |
| R6 | `GET /tv-packages` | `sort=order:asc&populate=features` | TvPackage[] |
| R7 | `GET /tv-categories` | `sort=order:asc` | TvCategory[] |
| R8 | `GET /tv-channels` | `sort=order:asc&populate=category&pagination[pageSize]=500` | TvChannel[] |
| R9 | `GET /promos` | `sort=order:asc&filters[validUntil][$gte]=<today>` | Promo[] |
| R10 | `GET /dc-services`, `GET /dc-facts` | `sort=order:asc` | DcService[], DcFact[] |
| R11 | `GET /shop-items` | `sort=order:asc&populate=image` | ShopItem[] |
| R12 | `GET /payment-methods` | `sort=order:asc&populate=steps` | PaymentMethod[] |
| R13 | `GET /payment-details` | `populate=items` | PaymentDetails |
| R14 | `GET /articles` | `sort=publishedDate:desc&populate[category]=true&populate[cover]=true&pagination[page]=N&pagination[pageSize]=12[&filters[category][slug][$eq]=x]` | Article[] + pagination meta |
| R15 | `GET /articles` | `filters[slug][$eq]=<slug>&populate=*` | Article (0..1) |
| R16 | `GET /article-categories` | `sort=order:asc` | ArticleCategory[] |
| R17 | `GET /coverage` *(custom)* | `locale` | CoverageTree (below) |
| R18 | `GET /settlements` | `filters[slug][$eq]=<slug>&populate[district][populate]=region&populate[neighbourhoods]=true&populate[seo]=true` | Settlement (0..1) |
| R19 | `GET /assistant-settings` | `populate=*` | AssistantSettings |
| R20 | `GET /radio` | `populate=*` | Radio |

### CoverageTree (R17)
```json
{
  "data": {
    "regions": [
      {
        "slug": "kharkivska",
        "name": "Харківська область",
        "districts": [
          {
            "slug": "kharkivskyi",
            "name": "Харківський район",
            "settlements": [
              {
                "slug": "kharkiv",
                "name": "Харків",
                "lat": 49.9935,
                "lng": 36.2304,
                "isRegionalCentre": true,
                "neighbourhoods": [{ "name": "Центр", "priceModifier": 30 }]
              }
            ]
          }
        ]
      }
    ],
    "settlementCount": 46
  }
}
```

## Writes

| # | Endpoint | Body | Auth |
|---|---|---|---|
| W1 | `POST /leads` | `{ "data": { type, name, phone, reasonKey, reasonLabel, message, region, district, settlement, neighbourhood, locale, sourcePath, context } }` | frontend-server token (create only) |

Response `201 { data: { documentId } }`. Public role → `403`.

## Webhook (CMS → frontend)

`POST ${FRONTEND_URL}/api/revalidate`, header `x-revalidate-secret: ${FRONTEND_REVALIDATE_SECRET}`, body = Strapi webhook payload (`event`, `model`, `entry`). Frontend purges cache tags by `model` (e.g. `plan` → `home`, `coverage`, `assistant`).

## Shapes (abridged TypeScript, mirrored in `novaline-fe/shared/types/cms.ts`)

```ts
type Locale = 'uk' | 'en'
interface Seo { metaTitle?: string; metaDescription?: string; ogImage?: Media | null; noIndex?: boolean }
interface Media { url: string; alternativeText?: string | null; width?: number; height?: number }
interface Plan { documentId: string; key: string; segment: 'private' | 'apartment' | 'business'; name: string;
  speedLabel: string; price: number | null; priceLabel?: string | null; periodLabel: string; popular: boolean;
  features: { text: string }[]; availableForCoverage: boolean; coverageCaption?: string | null; order: number }
interface Settlement { slug: string; name: string; lat: number | null; lng: number | null; isRegionalCentre: boolean;
  neighbourhoods: { name: string; priceModifier: number }[] }
// … full list generated from data-model.md during implementation
```

import type { Core } from '@strapi/strapi';

const DEFAULT_LOCALE = 'uk';

interface TreeOffer {
  technology: string;
  audience: string;
  tariffs: { speed: number; price: number; extra: string | null }[];
  connectionPrice: number | null;
  connectionPriceOld: number | null;
  connectionPromo: boolean;
  note: string | null;
  noteEn: string | null;
}
interface TreeNeighbourhood { name: string; offers: TreeOffer[] }
interface TreeSettlement {
  slug: string;
  name: string;
  nameLocative: string | null;
  lat: number | null;
  lng: number | null;
  isRegionalCentre: boolean;
  offers: TreeOffer[];
  neighbourhoods: TreeNeighbourhood[];
}
interface TreeDistrict { slug: string; name: string; settlements: TreeSettlement[] }
interface TreeRegion { slug: string; name: string; districts: TreeDistrict[] }

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v));
const byOrder = (a: { order?: number | null }, b: { order?: number | null }) => (a.order ?? 0) - (b.order ?? 0);
const OFFERS = { offers: { populate: ['tariffs'] } };

/** Offers are not localised, so they are always read from the default-locale entry. */
const toOffers = (offers: any[] | null | undefined): TreeOffer[] =>
  (offers ?? []).map((o) => ({
    technology: o.technology,
    audience: o.audience,
    tariffs: (o.tariffs ?? []).map((t: any) => ({ speed: Number(t.speed), price: Number(t.price), extra: t.extra || null })),
    connectionPrice: num(o.connectionPrice),
    connectionPriceOld: num(o.connectionPriceOld),
    connectionPromo: !!o.connectionPromo,
    note: o.note || null,
    noteEn: o.noteEn || null,
  }));

/**
 * Builds the published coverage tree (region → district → settlement → neighbourhood) in one pass.
 * Missing translations fall back to the default locale per node, so the tree shape never changes between locales.
 */
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async tree(locale = DEFAULT_LOCALE) {
    const load = async (uid: string, populate: Record<string, unknown>, loc: string) =>
      (await strapi.documents(uid as any).findMany({ locale: loc, status: 'published', populate, limit: -1 } as any)) as any[];

    const fetchAll = async (loc: string) => ({
      regions: await load('api::region.region', {}, loc),
      districts: await load('api::district.district', { region: { fields: ['documentId'] } }, loc),
      settlements: await load('api::settlement.settlement', { district: { fields: ['documentId'] }, ...OFFERS }, loc),
      neighbourhoods: await load('api::neighbourhood.neighbourhood', { settlement: { fields: ['documentId'] }, ...OFFERS }, loc),
    });

    const base = await fetchAll(DEFAULT_LOCALE);
    const loc = locale === DEFAULT_LOCALE ? base : await fetchAll(locale);
    const name = (list: any[], item: any) => list.find((x) => x.documentId === item.documentId)?.name ?? item.name;
    const locative = (item: any) =>
      loc.settlements.find((x) => x.documentId === item.documentId)?.nameLocative ?? item.nameLocative ?? null;

    const neighbourhoodsOf = (settlementId: string): TreeNeighbourhood[] =>
      base.neighbourhoods
        .filter((n) => n.settlement?.documentId === settlementId)
        .sort(byOrder)
        .map((n) => ({ name: name(loc.neighbourhoods, n), offers: toOffers(n.offers) }));

    const settlementsOf = (districtId: string): TreeSettlement[] =>
      base.settlements
        .filter((s) => s.district?.documentId === districtId)
        .sort(byOrder)
        .map((s) => ({
          slug: s.slug,
          name: name(loc.settlements, s),
          nameLocative: locative(s),
          lat: num(s.lat),
          lng: num(s.lng),
          isRegionalCentre: !!s.isRegionalCentre,
          offers: toOffers(s.offers),
          neighbourhoods: neighbourhoodsOf(s.documentId),
        }));

    const regions: TreeRegion[] = base.regions.sort(byOrder).map((r) => ({
      slug: r.slug,
      name: name(loc.regions, r),
      districts: base.districts
        .filter((d) => d.region?.documentId === r.documentId)
        .sort(byOrder)
        .map((d) => ({ slug: d.slug, name: name(loc.districts, d), settlements: settlementsOf(d.documentId) })),
    }));

    const settlementCount = regions.reduce(
      (sum, r) => sum + r.districts.reduce((s, d) => s + d.settlements.length, 0),
      0,
    );
    return { regions, settlementCount };
  },
});

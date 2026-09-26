/**
 * Idempotent seed: loads the prototype content (uk + en) into Strapi.
 *
 *   npm run seed
 *
 * Entries are matched by a stable key (`key` attribute, or `slug` for geography). Existing entries are never
 * overwritten, so manual edits in the admin survive re-runs; missing locales are added.
 */
import fs from 'node:fs';
import path from 'node:path';
import { compileStrapi, createStrapi } from '@strapi/strapi';
import type { Core } from '@strapi/strapi';

type Data = Record<string, unknown>;
interface Relation { uid: string; field: string; value: string }
interface Entry { key: string; shared: Data; uk: Data; en: Data; relations?: Record<string, Relation> }
interface Single { shared: Data; uk: Data; en: Data; media?: Record<string, string> }
interface Content { singles: Record<string, Single>; collections: [string, Entry[]][] }

const SEED_DIR = path.join(process.cwd(), 'scripts', 'seed-data');
const LOCALES = ['uk', 'en'] as const;
type Locale = (typeof LOCALES)[number];

const stats = { created: 0, localised: 0, skipped: 0 };

const docs = (strapi: Core.Strapi, uid: string) => strapi.documents(uid as any) as any;

/** Sets a value at a dotted path, e.g. "hero.image". */
function setPath(target: Data, dotted: string, value: unknown) {
  const keys = dotted.split('.');
  let node = target;
  for (const k of keys.slice(0, -1)) node = (node[k] ??= {}) as Data;
  node[keys[keys.length - 1]] = value;
}

async function uploadMedia(strapi: Core.Strapi, fileName: string, alt: string): Promise<number> {
  const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name: fileName } });
  if (existing) return existing.id;
  const filepath = path.join(SEED_DIR, 'media', fileName);
  const mimetype = fileName.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  const [file] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      data: { fileInfo: { name: fileName, alternativeText: alt } },
      files: { filepath, originalFilename: fileName, mimetype, size: fs.statSync(filepath).size },
    });
  return file.id;
}

async function resolveRelations(strapi: Core.Strapi, relations: Entry['relations'], locale: Locale): Promise<Data> {
  const out: Data = {};
  for (const [field, rel] of Object.entries(relations ?? {})) {
    const target = await docs(strapi, rel.uid).findFirst({ locale, filters: { [rel.field]: rel.value } });
    if (!target) throw new Error(`Relation target not found: ${rel.uid} ${rel.field}=${rel.value} (${locale})`);
    out[field] = { connect: [{ documentId: target.documentId, locale }] };
  }
  return out;
}

async function seedSingle(strapi: Core.Strapi, uid: string, single: Single) {
  const media: Data = {};
  for (const [dotted, fileName] of Object.entries(single.media ?? {})) {
    setPath(media, dotted, await uploadMedia(strapi, fileName, 'NovaLine'));
  }
  const withMedia = (data: Data): Data => {
    const copy = structuredClone(data);
    for (const [dotted, id] of Object.entries(flatten(media))) setPath(copy, dotted, id);
    return copy;
  };

  const existing = await docs(strapi, uid).findFirst({ locale: 'uk' });
  let documentId = existing?.documentId as string | undefined;
  if (!documentId) {
    const created = await docs(strapi, uid).create({ locale: 'uk', status: 'published', data: withMedia({ ...single.shared, ...single.uk }) });
    documentId = created.documentId;
    stats.created++;
  } else stats.skipped++;

  if (!(await docs(strapi, uid).findOne({ documentId, locale: 'en' }))) {
    await docs(strapi, uid).update({ documentId, locale: 'en', status: 'published', data: withMedia({ ...single.shared, ...single.en }) });
    stats.localised++;
  }
}

function flatten(obj: Data, prefix = ''): Record<string, unknown> {
  return Object.entries(obj).reduce<Record<string, unknown>>((acc, [k, v]) => {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(acc, flatten(v as Data, p));
    else acc[p] = v;
    return acc;
  }, {});
}

async function seedCollection(strapi: Core.Strapi, uid: string, entries: Entry[]) {
  const attributes = (strapi.contentTypes as Record<string, any>)[uid].attributes;
  const keyField = attributes.key ? 'key' : 'slug';

  for (const entry of entries) {
    const identity = keyField === 'key' ? { key: entry.key } : {};
    const existing = await docs(strapi, uid).findFirst({ locale: 'uk', filters: { [keyField]: entry.key } });
    let documentId = existing?.documentId as string | undefined;

    if (!documentId) {
      const created = await docs(strapi, uid).create({
        locale: 'uk',
        status: 'published',
        data: { ...identity, ...entry.shared, ...entry.uk, ...(await resolveRelations(strapi, entry.relations, 'uk')) },
      });
      documentId = created.documentId;
      stats.created++;
    } else stats.skipped++;

    if (!(await docs(strapi, uid).findOne({ documentId, locale: 'en' }))) {
      await docs(strapi, uid).update({
        documentId,
        locale: 'en',
        status: 'published',
        data: { ...identity, ...entry.shared, ...entry.en, ...(await resolveRelations(strapi, entry.relations, 'en')) },
      });
      stats.localised++;
    }
  }
  strapi.log.info(`[seed] ${uid}: ${entries.length} entries`);
}

async function main() {
  const content: Content = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'content.json'), 'utf8'));
  const app = await createStrapi(await compileStrapi()).load();
  app.log.level = 'info';
  try {
    for (const [uid, single] of Object.entries(content.singles)) await seedSingle(app, uid, single);
    for (const [uid, entries] of content.collections) await seedCollection(app, uid, entries);
    app.log.info(`[seed] done — created ${stats.created}, localised ${stats.localised}, skipped ${stats.skipped}`);
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

/**
 * Builds the coverage part of the seed (regions → districts → settlements → neighbourhoods + connection offers)
 * from `legacy-rates.json`, a snapshot of the "Умови підключення" block of the previous novaline.net site.
 *
 *   node scripts/seed-data/build-coverage.mjs            # rewrites the geo collections in content.json
 *   node scripts/seed-data/build-coverage.mjs --dry-run  # prints a summary and the generated locatives only
 *
 * The snapshot keeps the client's own grouping (pre-2020 districts; Kharkiv split into neighbourhoods).
 * Run once after refreshing the snapshot, review the locatives, commit content.json.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const legacy = JSON.parse(fs.readFileSync(path.join(DIR, 'legacy-rates.json'), 'utf8'));
const CONTENT = path.join(DIR, 'content.json');
const DRY = process.argv.includes('--dry-run');

// ---------- transliteration (official Ukrainian → Latin, KMU 2010) ----------
const MAP = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', '’': '', "'": '', ʼ: '',
};
const INITIAL = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };
function translit(text) {
  return text.replace(/[\p{L}’'ʼ]+/gu, (word) => {
    let out = '';
    const lower = word.toLowerCase();
    for (let i = 0; i < lower.length; i++) {
      const ch = lower[i];
      if (ch === 'з' && lower[i + 1] === 'г') {
        out += 'zgh';
        i++;
        continue;
      }
      out += (i === 0 && INITIAL[ch]) || (MAP[ch] ?? ch);
    }
    return word[0] === word[0].toUpperCase() ? out.charAt(0).toUpperCase() + out.slice(1) : out;
  });
}
const slugify = (text) =>
  translit(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ---------- Ukrainian locative ("у Пісочині") ----------
function locWord(word, { adjective = false } = {}) {
  const w = word;
  if (/(ова|ьова|ева)$/.test(w)) return w.replace(/а$/, 'ій'); // Лозова, Польова: adjectives even when alone
  if (/(ський|цький|зький|ий)$/.test(w)) return w.replace(/ий$/, 'ому');
  if (/ій$/.test(w)) return w.replace(/ій$/, 'ьому');
  if (/[іи]е$/.test(w)) return w;
  if (/е$/.test(w)) return w.replace(/е$/, 'ому'); // Веселе, Зернове
  if (/є$/.test(w)) return w.replace(/є$/, 'ьому');
  if (/(ські|цькі|зькі|ні|ві|ті|рі|лі)$/.test(w) && adjective) return w.replace(/і$/, 'их');
  if (/ія$/.test(w)) return w.replace(/я$/, 'ї'); // Балаклія
  if (adjective && /[ая]$/.test(w)) return w.replace(/[ая]$/, 'ій'); // Велика, Верхня
  if (/ка$/.test(w)) return w.replace(/ка$/, 'ці');
  if (/га$/.test(w)) return w.replace(/га$/, 'зі');
  if (/ха$/.test(w)) return w.replace(/ха$/, 'сі');
  if (/[ая]$/.test(w)) return w.replace(/[ая]$/, 'і');
  if (/[чшжщ]і$/.test(w)) return w.replace(/і$/, 'ах'); // Кулиничі, Родичі
  if (/[ії]$/.test(w)) return w.replace(/[ії]$/, 'ях'); // Липці, Свинарі, Скрипаї
  if (/и$/.test(w)) return w.replace(/и$/, 'ах'); // Циркуни, Тишки
  if (/(ськ|цьк)$/.test(w)) return `${w}у`;
  if (/ів$/.test(w)) return w.replace(/ів$/, 'ові'); // Харків
  if (/їв$/.test(w)) return w.replace(/їв$/, 'єві'); // Чугуїв
  if (/[кгх]$/.test(w)) return `${w}у`; // Байрак
  if (/о$/.test(w)) return w.replace(/о$/, 'і'); // Зубово
  if (/ь$/.test(w)) return w.replace(/ь$/, 'і');
  if (/й$/.test(w)) return w.replace(/й$/, 'ї');
  return `${w}і`;
}
/** Words that are adjectives in multi-word names ("Руські Тишки", "Верхня Роганка"). */
const isAdjective = (word, index, words) =>
  words.length > 1 && index < words.length - 1 && /(ий|ій|а|я|е|і)$/.test(word) && !/^(та|і)$/.test(word);

const LOCATIVE_OVERRIDES = {
  // Irregular or ambiguous forms, reviewed by hand.
  Харків: 'у Харкові',
  Полтава: 'у Полтаві',
  Ужгород: 'в Ужгороді',
  Люботин: 'у Люботині',
  'Софіївка Перша': 'у Софіївці Першій',
  'Ганно-Рудаєве': 'у Ганно-Рудаєвому',
  'Миколо-Комишувата': 'у Миколо-Комишуватій',
  'Гонтів Яр': 'у Гонтовому Ярі',
  'Данильчин Кут': 'у Данильчиному Куті',
  'Дачний кооператив Тракторобудівників': 'у дачному кооперативі Тракторобудівників',
  Чепіль: 'у Чепелі',
  Перекіп: 'у Перекопі',
  Водопій: 'у Водопої',
  Тростянець: 'у Тростянці',
};
function locative(name) {
  if (LOCATIVE_OVERRIDES[name]) return LOCATIVE_OVERRIDES[name];
  const main = name.replace(/\s*\(.*\)\s*$/, '');
  const suffix = name.slice(main.length);
  const words = main.split(/(\s+|-)/);
  const tokens = words.filter((t) => !/^(\s+|-)$/.test(t));
  let ti = 0;
  const declined = words
    .map((t) => {
      if (/^(\s+|-)$/.test(t) || /^(та|і)$/.test(t)) return t;
      const index = ti++;
      return locWord(t, { adjective: isAdjective(t, index, tokens) });
    })
    .join('');
  const prep = /^[АЕЄИІЇОУЮЯаеєиіїоуюя]/.test(main) ? 'в' : 'у';
  return `${prep} ${declined}${suffix}`;
}

// ---------- geography ----------
const REGIONS = [
  { slug: 'kharkivska', uk: 'Харківська область', en: 'Kharkiv Oblast' },
  { slug: 'poltavska', uk: 'Полтавська область', en: 'Poltava Oblast' },
  { slug: 'sumska', uk: 'Сумська область', en: 'Sumy Oblast' },
  { slug: 'kirovohradska', uk: 'Кіровоградська область', en: 'Kirovohrad Oblast' },
  { slug: 'zakarpatska', uk: 'Закарпатська область', en: 'Zakarpattia Oblast' },
];
/** Legacy group label → district (uk name, EN name, region). "Харків" is the city split into neighbourhoods. */
const DISTRICTS = {
  Харків: { uk: 'м. Харків', en: 'Kharkiv city', slug: 'kharkiv-misto', region: 'kharkivska' },
  'Харківський район': { en: 'Kharkiv Raion', region: 'kharkivska' },
  'Дергачівський район': { en: 'Derhachi Raion', region: 'kharkivska' },
  'Золочівський район': { en: 'Zolochiv Raion', region: 'kharkivska' },
  'Богодухівський район': { en: 'Bohodukhiv Raion', region: 'kharkivska' },
  'Валківський район': { en: 'Valky Raion', region: 'kharkivska' },
  'Краснокутський район': { en: 'Krasnokutsk Raion', region: 'kharkivska' },
  'Зміївський район': { en: 'Zmiiv Raion', region: 'kharkivska' },
  'Чугуївський район': { en: 'Chuhuiv Raion', region: 'kharkivska' },
  'Балаклійський район': { en: 'Balakliia Raion', region: 'kharkivska' },
  'Ізюмський район': { en: 'Izium Raion', region: 'kharkivska' },
  'Лозівський район': { en: 'Lozova Raion', region: 'kharkivska' },
  'Близнюківський район': { en: 'Blyzniuky Raion', region: 'kharkivska' },
  'Красноградський район': { en: 'Krasnohrad Raion', region: 'kharkivska' },
  'Полтавський район': { en: 'Poltava Raion', region: 'poltavska' },
  'Охтирський район': { en: 'Okhtyrka Raion', region: 'sumska' },
  'Олександрійський район': { en: 'Oleksandriia Raion', region: 'kirovohradska' },
  'Ужгородський район': { en: 'Uzhhorod Raion', region: 'zakarpatska' },
};
/** Settlements listed under "Інше" on the old site, with the district they belong to. */
const OTHER_DISTRICT = { Степове: 'Лозівський район' };
const REGIONAL_CENTRES = new Set(['Харків', 'Полтава', 'Ужгород']);

const tidy = (s) => s.replace(/\s+/g, ' ').replace(/[`']/g, '’').trim();

// ---------- offers ----------
const TECHNOLOGY = { GPON: 'GPON', EPON: 'EPON', ETHERNET: 'Ethernet', WIFI: 'WiFi' };
const AUDIENCE = {
  'Приватний сектор': 'private',
  'Багатоквартирні будинки': 'apartment',
  'Приватний сектор, квартири': 'private_apartment',
  'Приватний сектор та багатоквартирні будинки': 'private_apartment',
};
/** Notes cleaned up (typos, shouting caps) with their English translation. */
const NOTES = [
  [/^У вартість підключення входить 1 місяць доступу до Інтернету\.?$/, 'У вартість підключення входить 1 місяць доступу до інтернету.', 'Connection includes 1 month of internet access.'],
  [/^У вартість підключення входить:? 2 місяці доступу до Інтернету\.?$/, 'У вартість підключення входить 2 місяці доступу до інтернету.', 'Connection includes 2 months of internet access.'],
  [/^У вартість підключення входить 3 місяці (БЕЗКОШТОВНОГО )?доступу до Інтернету\.?$/, 'У вартість підключення входить 3 місяці безкоштовного доступу до інтернету.', 'Connection includes 3 months of free internet access.'],
  [/^У вартість підключення входить 3 місяці БЕЗКОШТОВНОГО доступу до Інтернету \*Акція триває до 01\.09\.2026$/, 'У вартість підключення входить 3 місяці безкоштовного доступу до інтернету. Акція триває до 01.09.2026.', 'Connection includes 3 months of free internet access. Offer valid until 01.09.2026.'],
  [/^У вартість підключення входить 10 днів доступу до Інтернету\.?$/, 'У вартість підключення входить 10 днів доступу до інтернету.', 'Connection includes 10 days of internet access.'],
  [/^У вартість підключення перший місяць доступу до Інтернету не входить\.?$/, 'Перший місяць доступу до інтернету у вартість підключення не входить.', 'The first month of internet access is not included in the connection price.'],
  [/^У вартість підключення перший місяць доступу до Інтернету не входить\. Підключення при наявності оптики - безкоштовно!$/, 'Перший місяць доступу до інтернету у вартість підключення не входить. Якщо оптика вже заведена — підключення безкоштовне.', 'The first month of internet access is not included. If fibre is already installed, connection is free.'],
  [/^У вартість підключення входить ТБ \(мінімальний пакет\) Підключення при наявності оптики та терміналу ONU - 500 грн$/, 'У вартість підключення входить ТБ (мінімальний пакет). Якщо вже є оптика й термінал ONU — підключення 500 грн.', 'Connection includes TV (minimum package). With fibre and an ONU terminal already in place, connection costs 500 UAH.'],
  [/^Підключення при наявності оптики та терміналу ONU - 500 грн$/, 'Якщо вже є оптика й термінал ONU — підключення 500 грн.', 'With fibre and an ONU terminal already in place, connection costs 500 UAH.'],
  [/^У вартість підключення входить 3 місяці БЕЗКОШТОВНОГО доступу до Інтернету\. Підключення при наявності оптики - безкоштовно та 3 місяці БЕЗКОШТОВНОГО доступу до Інтернету\.$/, 'У вартість підключення входить 3 місяці безкоштовного доступу до інтернету. Якщо оптика вже заведена — підключення безкоштовне, і 3 місяці доступу теж безкоштовні.', 'Connection includes 3 months of free internet access. If fibre is already installed, connection is free and the 3 months are free too.'],
  [/^У вартість підключення входить 1 місяць доступу до Інтернету\. Підключення при наявності оптики - безкоштовно!$/, 'У вартість підключення входить 1 місяць доступу до інтернету. Якщо оптика вже заведена — підключення безкоштовне.', 'Connection includes 1 month of internet access. If fibre is already installed, connection is free.'],
  [/^У вартість підключення входить 1 місяць доступу до Інтернету\. Підключення при наявності оптики - безкоштовно \(без першого місяця\)\.$/, 'У вартість підключення входить 1 місяць доступу до інтернету. Якщо оптика вже заведена — підключення безкоштовне (без першого місяця).', 'Connection includes 1 month of internet access. If fibre is already installed, connection is free (without the first month).'],
  [/^У вартість підключення входить 1 місяць доступу до Інтернету\. Підключення при наявності оптики 500 грн\. та 1 місяць доступу до Інтернету$/, 'У вартість підключення входить 1 місяць доступу до інтернету. Якщо оптика вже заведена — підключення 500 грн і 1 місяць доступу.', 'Connection includes 1 month of internet access. If fibre is already installed, connection costs 500 UAH including 1 month of access.'],
  [/^У вартість підключення входить 1 місяць доступу до Інтернету\. Підключення при наявності оптики БЕЗКОШОТВНО та 1 місяць доступу до Інтернету або 6 місяців БЕЗКОШТОВНОГО користування на тарифі "50 Мбіт\/с — 120 грн\/місяць"$/, 'У вартість підключення входить 1 місяць доступу до інтернету. Якщо оптика вже заведена — підключення безкоштовне з 1 місяцем доступу або 6 місяцями безкоштовного користування на тарифі «50 Мбіт/с — 120 грн/місяць».', 'Connection includes 1 month of internet access. If fibre is already installed, connection is free with 1 month of access or 6 free months on the “50 Mbps — 120 UAH/month” plan.'],
  [/^У вартість підключення входить 1 місяць доступу до Інтернету, перехід з антени безкоштовний$/, 'У вартість підключення входить 1 місяць доступу до інтернету. Перехід з антени — безкоштовно.', 'Connection includes 1 month of internet access. Switching from a radio antenna is free.'],
  [/^$/, null, null],
];
function note(raw) {
  const text = tidy(raw);
  const hit = NOTES.find(([re]) => re.test(text));
  if (!hit) throw new Error(`Untranslated note: "${text}"`);
  return { note: hit[1], noteEn: hit[2] };
}
const TARIFF = /^(\d+)\s*Мбіт\/[сc](?:\s*\+\s*(\S+))?\s*—\s*(\d+)\s*грн/;
function toOffer(card) {
  const technology = TECHNOLOGY[card.technology.trim().toUpperCase()];
  const audience = AUDIENCE[card.type[1]];
  if (!technology || !audience) throw new Error(`Unknown technology/audience in ${card.location}: ${card.technology} / ${card.type}`);
  return {
    technology,
    audience,
    tariffs: card.speeds.map((line) => {
      const m = TARIFF.exec(line);
      if (!m) throw new Error(`Unparsed tariff "${line}" in ${card.location}`);
      return { speed: Number(m[1]), price: Number(m[3]), ...(m[2] ? { extra: m[2] } : {}) };
    }),
    connectionPrice: card.connectionPrice,
    ...(card.connectionPriceOld ? { connectionPriceOld: card.connectionPriceOld } : {}),
    connectionPromo: card.promo,
    ...note(card.note),
  };
}
const offersByLocation = new Map();
for (const card of legacy.cards) {
  const list = offersByLocation.get(card.location) ?? [];
  list.push(toOffer(card));
  offersByLocation.set(card.location, list);
}

// ---------- assemble entries ----------
const regions = REGIONS.map((r, i) => ({ key: r.slug, shared: { slug: r.slug, order: i + 1 }, uk: { name: r.uk }, en: { name: r.en } }));
const districts = [];
const settlements = [];
const neighbourhoods = [];
const districtByLabel = new Map();

for (const group of legacy.groups) {
  if (group.label === 'Інше') continue;
  const meta = DISTRICTS[group.label];
  if (!meta) throw new Error(`Unmapped district group: ${group.label}`);
  const uk = meta.uk ?? group.label;
  const slug = meta.slug ?? slugify(uk.replace(/ район$/, ''));
  districtByLabel.set(group.label, slug);
  districts.push({
    key: slug,
    shared: { slug, order: districts.length + 1 },
    uk: { name: uk },
    en: { name: meta.en },
    relations: { region: { uid: 'api::region.region', field: 'slug', value: meta.region } },
  });
}

const rows = [];
for (const group of legacy.groups) {
  for (const option of group.options) {
    if (group.label === 'Харків') {
      rows.push({ kind: 'neighbourhood', name: tidy(option.label), location: option.value });
      continue;
    }
    let name = tidy(option.label);
    let districtLabel = group.label;
    if (group.label === 'Інше') {
      name = tidy(name.replace(/\s*\(.*\)$/, ''));
      districtLabel = OTHER_DISTRICT[name];
      if (!districtLabel) throw new Error(`No district for "Інше" settlement ${name}`);
    }
    rows.push({ kind: 'settlement', name, district: districtByLabel.get(districtLabel), location: option.value });
  }
}

const nameCount = rows.filter((r) => r.kind === 'settlement').reduce((m, r) => m.set(r.name, (m.get(r.name) ?? 0) + 1), new Map());
const usedSlugs = new Set();
const order = new Map();
function addSettlement({ name, district, offers }) {
  let slug = slugify(name);
  if ((nameCount.get(name) ?? 0) > 1 || usedSlugs.has(slug)) slug = `${slug}-${district}`;
  if (usedSlugs.has(slug)) throw new Error(`Duplicate slug ${slug}`);
  usedSlugs.add(slug);
  const n = (order.get(district) ?? 0) + 1;
  order.set(district, n);
  const en = translit(name);
  settlements.push({
    key: slug,
    shared: { slug, isRegionalCentre: REGIONAL_CENTRES.has(name), order: n, offers },
    uk: { name, nameLocative: locative(name) },
    en: { name: en, nameLocative: `in ${en}` },
    relations: { district: { uid: 'api::district.district', field: 'slug', value: district } },
  });
  return slug;
}

const kharkiv = addSettlement({ name: 'Харків', district: 'kharkiv-misto', offers: [] });
let nOrder = 0;
for (const row of rows) {
  const offers = offersByLocation.get(row.location);
  if (!offers) throw new Error(`No offers for ${row.location}`);
  if (row.kind === 'neighbourhood') {
    const key = `${kharkiv}-${slugify(row.name)}`;
    neighbourhoods.push({
      key,
      shared: { key, order: ++nOrder, offers },
      uk: { name: row.name },
      en: { name: translit(row.name) },
      relations: { settlement: { uid: 'api::settlement.settlement', field: 'slug', value: kharkiv } },
    });
  } else {
    addSettlement({ name: row.name, district: row.district, offers });
  }
}

// ---------- output ----------
console.log(`regions ${regions.length}, districts ${districts.length}, settlements ${settlements.length}, neighbourhoods ${neighbourhoods.length}`);
console.log(`offers: ${settlements.reduce((s, x) => s + x.shared.offers.length, 0) + neighbourhoods.reduce((s, x) => s + x.shared.offers.length, 0)}`);
if (DRY) {
  for (const s of settlements) console.log(`${s.uk.name}\t${s.uk.nameLocative}\t${s.key}`);
  process.exit(0);
}

const content = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
const GEO = {
  'api::region.region': regions,
  'api::district.district': districts,
  'api::settlement.settlement': settlements,
  'api::neighbourhood.neighbourhood': neighbourhoods,
};
content.collections = content.collections.map(([uid, entries]) => [uid, GEO[uid] ?? entries]);
fs.writeFileSync(CONTENT, `${JSON.stringify(content, null, 2)}\n`);
console.log('content.json updated');

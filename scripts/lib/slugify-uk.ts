/**
 * Ukrainian → Latin transliteration per the official KMU 2010 rules (Resolution No. 55),
 * used for stable, readable slugs (e.g. "Дубов’язівка" → "duboviazivka", "Харків" → "kharkiv").
 */
const MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i',
  ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia',
};
/** Letters with a different spelling at the start of a word. */
const WORD_START: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };
const APOSTROPHES = /['’ʼ`]/g;

export function transliterateUk(input: string): string {
  const text = input.replace(APOSTROPHES, '');
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const lower = ch.toLowerCase();
    const prev = text[i - 1];
    const atWordStart = i === 0 || !/[\p{L}]/u.test(prev);
    // "зг" is written "zgh" to distinguish it from "ж" (zh).
    let latin = lower === 'г' && prev?.toLowerCase() === 'з' ? 'gh' : atWordStart && WORD_START[lower] ? WORD_START[lower] : MAP[lower];
    if (latin === undefined) latin = lower;
    out += ch !== lower && latin ? latin[0].toUpperCase() + latin.slice(1) : latin;
  }
  return out;
}

export function slugifyUk(input: string): string {
  return transliterateUk(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

import { errors } from '@strapi/utils';

type Data = Record<string, any> | undefined;

const checkCta = (cta: Data, name: string) => {
  if (cta && cta.action === 'link' && !String(cta.url ?? '').trim()) {
    throw new errors.ValidationError(`"${name}" has action "link" but no URL.`);
  }
};

/** Throws when a slide's schedule or CTAs are inconsistent. Fields absent from a partial update are skipped. */
export function validateHeroSlide(data: Data) {
  if (!data) return;
  if (data.activeFrom && data.activeUntil && String(data.activeFrom) > String(data.activeUntil)) {
    throw new errors.ValidationError('"Active from" must not be later than "Active until".');
  }
  checkCta(data.primaryCta, 'Primary CTA');
  checkCta(data.secondaryCta, 'Secondary CTA');
}


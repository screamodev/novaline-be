import { errors } from '@strapi/utils';
import type { Core } from '@strapi/strapi';

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

/**
 * Runs on the Document Service (admin, REST and scripts alike). A DB lifecycle would not work here:
 * by then components are already stored and `data.primaryCta` is only a reference.
 */
export function registerHeroSlideValidation(strapi: Core.Strapi) {
  strapi.documents.use(async (ctx, next) => {
    if (ctx.uid === 'api::hero-slide.hero-slide' && (ctx.action === 'create' || ctx.action === 'update')) {
      validateHeroSlide((ctx.params as { data?: Data }).data);
    }
    return next();
  });
}

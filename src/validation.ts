import type { Core } from '@strapi/strapi';
import { validateHeroSlide } from './api/hero-slide/validate';
import { validatePlan } from './api/plan/validate';
import { validateVacancy } from './api/vacancy/validate';

type Validator = (data: Record<string, any> | undefined, action: string) => void;

const VALIDATORS: Record<string, Validator> = {
  'api::hero-slide.hero-slide': validateHeroSlide,
  'api::plan.plan': validatePlan,
  'api::vacancy.vacancy': validateVacancy,
};

/**
 * Cross-field checks run on the Document Service, i.e. once per save with the data the editor submitted
 * for that locale. DB lifecycles are the wrong place: Strapi copies shared fields (price, salary) to the
 * other locales in follow-up writes that carry no localized fields (priceLabel, salaryLabel), so a
 * lifecycle check fails there and blocks the save; components are also only references by then.
 */
export function registerValidation(strapi: Core.Strapi) {
  strapi.documents.use(async (ctx, next) => {
    const validate = VALIDATORS[ctx.uid];
    if (validate && (ctx.action === 'create' || ctx.action === 'update')) {
      validate((ctx.params as { data?: Record<string, any> }).data, ctx.action);
    }
    return next();
  });
}

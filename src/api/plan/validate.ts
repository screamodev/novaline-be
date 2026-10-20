import { errors } from '@strapi/utils';

type Data = Record<string, any> | undefined;

const empty = (v: unknown) => v === null || v === undefined || v === '';

/** A plan without a price must say why ("договірна"). Updates are checked only when they carry the price. */
export function validatePlan(data: Data, action: string) {
  if (!data || (action === 'update' && !('price' in data))) return;
  if (empty(data.price) && !String(data.priceLabel ?? '').trim()) {
    throw new errors.ValidationError('A plan without a price needs a "Price label" (e.g. "договірна").');
  }
}

import { errors } from '@strapi/utils';

interface LifecycleEvent {
  params: { data: Record<string, any> };
  result: Record<string, any>;
}

const check = (data: Record<string, unknown> | undefined) => {
  if (!data || !('price' in data)) return;
  const noPrice = data.price === null || data.price === undefined || data.price === '';
  if (noPrice && !data.priceLabel) {
    throw new errors.ApplicationError('A plan without a price needs a "Price label" (e.g. "договірна").');
  }
};

export default {
  beforeCreate(event: LifecycleEvent) {
    check(event.params.data);
  },
  beforeUpdate(event: LifecycleEvent) {
    check(event.params.data);
  },
};

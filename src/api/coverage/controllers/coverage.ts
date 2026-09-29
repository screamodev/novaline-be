import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async tree(ctx: Context) {
    const locale = typeof ctx.query.locale === 'string' ? ctx.query.locale : undefined;
    ctx.body = { data: await strapi.service('api::coverage.coverage').tree(locale) };
  },
});

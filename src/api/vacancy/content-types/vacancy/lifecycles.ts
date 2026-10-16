import { errors } from '@strapi/utils';

interface LifecycleEvent {
  params: { data: Record<string, any> };
  result: Record<string, any>;
}

const empty = (v: unknown) => v === null || v === undefined || v === '';

const check = (data: Record<string, any> | undefined) => {
  if (!data) return;
  if (!empty(data.salaryFrom) && !empty(data.salaryTo) && Number(data.salaryFrom) > Number(data.salaryTo)) {
    throw new errors.ApplicationError('"Salary from" must not be greater than "Salary to".');
  }
  // Only validate the label when the salary fields are part of this write (partial updates, locale copies).
  if ('salaryFrom' in data && 'salaryTo' in data && empty(data.salaryFrom) && empty(data.salaryTo) && !data.salaryLabel) {
    throw new errors.ApplicationError('A vacancy without a salary needs a "Salary label" (e.g. «за домовленістю»).');
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

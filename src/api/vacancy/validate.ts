import { errors } from '@strapi/utils';

type Data = Record<string, any> | undefined;

const empty = (v: unknown) => v === null || v === undefined || v === '';

/** Salary range must be ordered; with no numbers at all, the vacancy needs a salary label. */
export function validateVacancy(data: Data) {
  if (!data) return;
  if (!empty(data.salaryFrom) && !empty(data.salaryTo) && Number(data.salaryFrom) > Number(data.salaryTo)) {
    throw new errors.ValidationError('"Salary from" must not be greater than "Salary to".');
  }
  if ('salaryFrom' in data && 'salaryTo' in data && empty(data.salaryFrom) && empty(data.salaryTo) && !String(data.salaryLabel ?? '').trim()) {
    throw new errors.ValidationError('A vacancy without a salary needs a "Salary label" (e.g. «за домовленістю»).');
  }
}

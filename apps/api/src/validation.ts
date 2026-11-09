import { ApiError } from '@aifirst/shared';
import { z } from 'zod';

/** Parse with a zod schema, or throw a VALIDATION ApiError with per-field messages. */
export function parseOrThrow<S extends z.ZodType>(schema: S, value: unknown): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const { fieldErrors } = z.flattenError(result.error);
  throw new ApiError('VALIDATION', undefined, fieldErrors as Record<string, string[]>);
}

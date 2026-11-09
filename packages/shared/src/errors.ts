import { z } from 'zod';

export const ApiErrorCode = {
  EVENT_FULL: 'EVENT_FULL',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  EVENT_PAST: 'EVENT_PAST',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION: 'VALIDATION',
} as const;
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** HTTP status the API uses for each error code. */
export const apiErrorStatus: Record<ApiErrorCode, number> = {
  EVENT_FULL: 409,
  DUPLICATE_EMAIL: 409,
  EVENT_PAST: 409,
  NOT_FOUND: 404,
  VALIDATION: 400,
};

/** Default human-readable messages, shown in the UI. */
export const apiErrorMessage: Record<ApiErrorCode, string> = {
  EVENT_FULL: 'Sorry, this event is full.',
  DUPLICATE_EMAIL: 'This email is already registered for this event.',
  EVENT_PAST: 'This event has already happened, so RSVPs are closed.',
  NOT_FOUND: 'Event not found.',
  VALIDATION: 'Please fix the highlighted fields.',
};

/** JSON body of every non-2xx API response. */
export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: z.enum(ApiErrorCode),
    message: z.string(),
    /** Field name -> messages, present for VALIDATION errors. */
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor(code: ApiErrorCode, message?: string, fieldErrors?: Record<string, string[]>) {
    super(message ?? apiErrorMessage[code]);
    this.name = 'ApiError';
    this.code = code;
    this.status = apiErrorStatus[code];
    this.fieldErrors = fieldErrors;
  }

  toBody(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.fieldErrors ? { fieldErrors: this.fieldErrors } : {}),
      },
    };
  }
}

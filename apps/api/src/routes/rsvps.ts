import {
  ApiError,
  EventIdParamSchema,
  RsvpInputSchema,
  RsvpTokenParamSchema,
  type CancelRsvpResult,
  type RsvpLookup,
  type RsvpResult,
} from '@aifirst/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app';
import { cancelRsvp, createRsvp, getRsvpByToken } from '../services/rsvp-service';
import { parseOrThrow } from '../validation';

/** A malformed token in a link is just an invalid link, not a form error. */
function parseToken(params: unknown): string {
  const parsed = RsvpTokenParamSchema.safeParse(params);
  if (!parsed.success) throw new ApiError('RSVP_NOT_FOUND');
  return parsed.data.token;
}

export const rsvpRoutes =
  (deps: AppDeps): FastifyPluginAsync =>
  async (app) => {
    app.post('/events/:id/rsvps', async (req, reply): Promise<RsvpResult> => {
      const { id } = parseOrThrow(EventIdParamSchema, req.params);
      const input = parseOrThrow(RsvpInputSchema, req.body ?? {});
      const result = await createRsvp({ ...deps, log: req.log }, id, input);
      reply.code(201);
      return result;
    });

    /** Who/what an emailed cancel link refers to. */
    app.get('/rsvps/:token', async (req): Promise<RsvpLookup> => {
      return getRsvpByToken(deps, parseToken(req.params));
    });

    app.post('/rsvps/:token/cancel', async (req): Promise<CancelRsvpResult> => {
      return cancelRsvp({ ...deps, log: req.log }, parseToken(req.params));
    });
  };

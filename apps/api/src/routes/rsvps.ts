import { EventIdParamSchema, RsvpInputSchema, type RsvpResult } from '@aifirst/shared';
import type { FastifyPluginAsync } from 'fastify';
import type { AppDeps } from '../app';
import { createRsvp } from '../services/rsvp-service';
import { parseOrThrow } from '../validation';

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
  };

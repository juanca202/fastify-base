import type { FastifyPluginAsyncZod } from '@fastify/type-provider-zod';
import { healthResponseSchema } from './health.schemas.js';

const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/',
    {
      schema: {
        tags: ['Health'],
        summary: 'Checks that the process is responding',
        response: {
          200: healthResponseSchema,
        },
      },
      prefixTrailingSlash: 'no-slash',
      config: { otel: false },
    },
    async () => ({
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    }),
  );
};

export default healthRoutes;

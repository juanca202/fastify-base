import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from '@fastify/type-provider-zod';
import { env } from './config/env.js';
import errorHandler from './plugins/error-handler.js';
import authPlugin from './plugins/auth.js';
import databasePlugin from './plugins/database.js';
import openapiPlugin from './plugins/openapi.js';
import healthRoutes from './modules/health/health.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
            },
          }
        : {}),
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorHandler);
  await app.register(authPlugin);
  await app.register(databasePlugin);
  await app.register(openapiPlugin);
  await app.register(healthRoutes, { prefix: '/health' });

  return app;
}

import swagger from '@fastify/swagger';
import { jsonSchemaTransform } from '@fastify/type-provider-zod';
import scalar from '@scalar/fastify-api-reference';
import fp from 'fastify-plugin';

export default fp(
  async (app) => {
    await app.register(swagger, {
      openapi: {
        openapi: '3.1.0',
        info: {
          title: 'Fastify Base API',
          description:
            'API First template: Zod contracts published as OpenAPI 3.1 and documented with Scalar.',
          version: '1.0.0',
        },
        tags: [{ name: 'Health', description: 'Service availability' }],
      },
      transform: jsonSchemaTransform,
    });

    await app.register(scalar, {
      routePrefix: '/docs',
    });
  },
  { name: 'openapi' },
);

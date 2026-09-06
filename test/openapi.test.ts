import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

const app = await buildApp();

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('OpenAPI + Scalar', () => {
  it('expone el documento OpenAPI 3.1', async () => {
    const spec = app.swagger();
    expect('openapi' in spec && spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toBe('Fastify Base API');
    if (!('paths' in spec)) {
      throw new Error('el documento OpenAPI no incluye paths');
    }
    expect(spec.paths?.['/health']).toBeDefined();
  });

  it('sirve la documentación Scalar', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs/' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('Scalar');
  });
});

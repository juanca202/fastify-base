import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from '@fastify/type-provider-zod';
import { z } from 'zod';
import errorHandler from '../src/plugins/error-handler.js';

const app = Fastify({ logger: { level: 'silent' } }).withTypeProvider<ZodTypeProvider>();
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
await app.register(errorHandler);

app.post(
  '/probe',
  {
    schema: {
      body: z.object({ n: z.number() }),
      response: { 200: z.object({ n: z.number() }) },
    },
  },
  async (request) => request.body,
);

app.get(
  '/mismatch',
  {
    schema: {
      response: { 200: z.object({ ok: z.literal(true) }) },
    },
  },
  async () => ({ ok: false }) as unknown as { ok: true },
);

app.get('/forbidden', async () => {
  const error = Object.assign(new Error('no permitido'), { statusCode: 403, name: 'Forbidden' });
  throw error;
});

app.get('/boom', async () => {
  throw new Error('kaboom');
});

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('error-handler', () => {
  it('responde 400 cuando el cuerpo no cumple el contrato', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/probe',
      payload: { n: 'x' },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe('Bad Request');
    expect(body.issues).toBeDefined();
  });

  it('responde 500 cuando la respuesta no cumple el contrato', async () => {
    const response = await app.inject({ method: 'GET', url: '/mismatch' });

    expect(response.statusCode).toBe(500);
    expect(response.json().message).toBe('Response does not match the contract');
  });

  it('propaga statusCode de errores de cliente', async () => {
    const response = await app.inject({ method: 'GET', url: '/forbidden' });

    expect(response.statusCode).toBe(403);
    const body = response.json();
    expect(body.error).toBe('Forbidden');
    expect(body.message).toBe('no permitido');
  });

  it('responde 500 ante un error sin statusCode', async () => {
    const response = await app.inject({ method: 'GET', url: '/boom' });

    expect(response.statusCode).toBe(500);
    expect(response.json().message).toBe('Internal error');
  });
});

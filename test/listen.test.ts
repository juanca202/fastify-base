import { afterEach, describe, expect, it } from 'vitest';
import net from 'node:net';
import type { AddressInfo } from 'node:net';
import Fastify from 'fastify';
import {
  isAffirmativeAnswer,
  ListenPortDeclinedError,
  listenOnAvailablePort,
  shouldTerminateWatchParent,
} from '../src/listen.js';

async function occupy(host: string, port = 0): Promise<{ server: net.Server; port: number }> {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen({ host, port }, () => resolve());
  });
  const address = server.address() as AddressInfo;
  return { server, port: address.port };
}

async function closeServer(server: net.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe('isAffirmativeAnswer', () => {
  it('acepta vacío, s, si, sí, y, yes', () => {
    expect(isAffirmativeAnswer('')).toBe(true);
    expect(isAffirmativeAnswer('s')).toBe(true);
    expect(isAffirmativeAnswer('SI')).toBe(true);
    expect(isAffirmativeAnswer('sí')).toBe(true);
    expect(isAffirmativeAnswer(' y ')).toBe(true);
    expect(isAffirmativeAnswer('yes')).toBe(true);
  });

  it('rechaza n, no u otra respuesta', () => {
    expect(isAffirmativeAnswer('n')).toBe(false);
    expect(isAffirmativeAnswer('N')).toBe(false);
    expect(isAffirmativeAnswer('no')).toBe(false);
  });
});

describe('shouldTerminateWatchParent', () => {
  it('es true para el script de npm run dev', () => {
    expect(shouldTerminateWatchParent('tsx watch src/server.ts')).toBe(true);
  });

  it('es false para start o sin watcher', () => {
    expect(shouldTerminateWatchParent('node dist/server.js')).toBe(false);
    expect(shouldTerminateWatchParent(undefined)).toBe(false);
  });
});

describe('listenOnAvailablePort', () => {
  const blockers: net.Server[] = [];
  const apps: ReturnType<typeof Fastify>[] = [];

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
    await Promise.all(blockers.splice(0).map((server) => closeServer(server)));
  });

  it('escucha en el puerto preferido cuando está libre', async () => {
    const app = Fastify({ logger: { level: 'silent' } });
    apps.push(app);

    const port = await listenOnAvailablePort(app, { host: '127.0.0.1', port: 0 });

    expect(port).toBeGreaterThan(0);
    expect(app.server.listening).toBe(true);
  });

  it('pregunta y usa el puerto candidato si el usuario acepta', async () => {
    const occupied = await occupy('127.0.0.1');
    blockers.push(occupied.server);

    const asked: number[][] = [];
    const warnings: string[] = [];
    const app = Fastify({ logger: { level: 'silent' } });
    apps.push(app);
    app.log.warn = ((bindings: unknown, message?: string) => {
      if (typeof message === 'string') warnings.push(message);
    }) as typeof app.log.warn;

    const port = await listenOnAvailablePort(app, {
      host: '127.0.0.1',
      port: occupied.port,
      confirm: async (preferredPort, candidatePort) => {
        asked.push([preferredPort, candidatePort]);
        return true;
      },
    });

    expect(asked).toEqual([[occupied.port, port]]);
    expect(port).not.toBe(occupied.port);
    expect(warnings[0]).toContain(`Port ${occupied.port} is in use`);
    expect(warnings[0]).toContain(`listening on ${port}`);
  });

  it('no cambia de puerto si el usuario rechaza', async () => {
    const occupied = await occupy('127.0.0.1');
    blockers.push(occupied.server);

    const app = Fastify({ logger: { level: 'silent' } });
    apps.push(app);

    await expect(
      listenOnAvailablePort(app, {
        host: '127.0.0.1',
        port: occupied.port,
        confirm: async () => false,
      }),
    ).rejects.toBeInstanceOf(ListenPortDeclinedError);
    expect(app.server.listening).toBe(false);
  });

  it('propaga errores que no son EADDRINUSE', async () => {
    const app = Fastify({ logger: { level: 'silent' } });
    apps.push(app);
    const originalListen = app.listen.bind(app);
    app.listen = (async () => {
      throw Object.assign(new Error('listen EACCES'), { code: 'EACCES' });
    }) as typeof app.listen;

    await expect(
      listenOnAvailablePort(app, { host: '127.0.0.1', port: 3000, maxAttempts: 3 }),
    ).rejects.toMatchObject({ code: 'EACCES' });

    app.listen = originalListen;
  });

  it('falla si todos los puertos del rango están ocupados', async () => {
    const first = await occupy('127.0.0.1');
    blockers.push(first.server);
    const second = await occupy('127.0.0.1', first.port + 1);
    blockers.push(second.server);

    const app = Fastify({ logger: { level: 'silent' } });
    apps.push(app);

    await expect(
      listenOnAvailablePort(app, {
        host: '127.0.0.1',
        port: first.port,
        maxAttempts: 2,
        confirm: async () => true,
      }),
    ).rejects.toMatchObject({ code: 'EADDRINUSE' });
  });
});

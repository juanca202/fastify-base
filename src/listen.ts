import { createInterface } from 'node:readline/promises';
import net from 'node:net';
import type { FastifyInstance } from 'fastify';

const DEFAULT_MAX_ATTEMPTS = 10;
const MAX_TCP_PORT = 65535;

export type ConfirmPortFallback = (
  preferredPort: number,
  candidatePort: number,
) => Promise<boolean>;

export class ListenPortDeclinedError extends Error {
  constructor(
    readonly preferredPort: number,
    readonly candidatePort: number,
  ) {
    super(
      `Port ${preferredPort} is in use; startup cancelled (set PORT=${candidatePort} to use it)`,
    );
    this.name = 'ListenPortDeclinedError';
  }
}

function isAddressInUse(error: unknown): boolean {
  return (
    typeof error === 'object' && error !== null && 'code' in error && error.code === 'EADDRINUSE'
  );
}

export function isAffirmativeAnswer(answer: string): boolean {
  const trimmed = answer.trim();
  if (trimmed === '') {
    return true;
  }
  return /^(s|si|sí|y|yes)$/i.test(trimmed);
}

export function shouldTerminateWatchParent(
  lifecycleScript = process.env.npm_lifecycle_script,
): boolean {
  const script = lifecycleScript ?? '';
  return /\btsx\b/.test(script) && /\bwatch\b/.test(script);
}

export async function confirmFallbackPort(
  preferredPort: number,
  candidatePort: number,
): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stderr.isTTY) {
    return false;
  }

  const rl = createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = await rl.question(
      `Port ${preferredPort} is in use. Listen on port ${candidatePort}? (Y/n) `,
    );
    return isAffirmativeAnswer(answer);
  } finally {
    rl.close();
  }
}

function isPortFree(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.listen({ host, port, exclusive: true }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(
  host: string,
  fromPort: number,
  lastPort: number,
): Promise<number | undefined> {
  for (let port = fromPort; port <= lastPort && port <= MAX_TCP_PORT; port += 1) {
    if (await isPortFree(host, port)) {
      return port;
    }
  }
  return undefined;
}

function boundPortOf(app: FastifyInstance, fallback: number): number {
  const address = app.server.address();
  return typeof address === 'object' && address !== null ? address.port : fallback;
}

/**
 * Escucha en el puerto preferido. Si está ocupado, pregunta antes de usar otro.
 */
export async function listenOnAvailablePort(
  app: FastifyInstance,
  options: {
    host: string;
    port: number;
    maxAttempts?: number;
    confirm?: ConfirmPortFallback;
  },
): Promise<number> {
  const preferredPort = options.port;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const lastPort = Math.min(preferredPort + maxAttempts - 1, MAX_TCP_PORT);
  const confirm = options.confirm ?? confirmFallbackPort;

  try {
    await app.listen({ host: options.host, port: preferredPort });
    return boundPortOf(app, preferredPort);
  } catch (error) {
    if (!isAddressInUse(error)) {
      throw error;
    }
  }

  let fromPort = preferredPort + 1;
  while (fromPort <= lastPort) {
    const candidatePort = await findAvailablePort(options.host, fromPort, lastPort);
    if (candidatePort === undefined) {
      throw Object.assign(new Error(`Port ${preferredPort} is in use; no other port available`), {
        code: 'EADDRINUSE',
      });
    }

    const accepted = await confirm(preferredPort, candidatePort);
    if (!accepted) {
      throw new ListenPortDeclinedError(preferredPort, candidatePort);
    }

    try {
      await app.listen({ host: options.host, port: candidatePort });
      const boundPort = boundPortOf(app, candidatePort);
      app.log.warn(
        { preferredPort, port: boundPort },
        `Port ${preferredPort} is in use; listening on ${boundPort} (set PORT=${boundPort} to pin it)`,
      );
      return boundPort;
    } catch (error) {
      if (!isAddressInUse(error)) {
        throw error;
      }
      fromPort = candidatePort + 1;
    }
  }

  throw Object.assign(new Error(`Port ${preferredPort} is in use; no other port available`), {
    code: 'EADDRINUSE',
  });
}

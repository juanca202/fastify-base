import 'dotenv/config';
import { env } from './config/env.js';
import { startTelemetry } from './telemetry.js';
import { buildApp } from './app.js';
import {
  ListenPortDeclinedError,
  listenOnAvailablePort,
  shouldTerminateWatchParent,
} from './listen.js';

startTelemetry();
const app = await buildApp();

function stopWatchParent(): void {
  if (!shouldTerminateWatchParent() || process.ppid <= 1) {
    return;
  }
  try {
    process.kill(process.ppid, 'SIGTERM');
  } catch {
    // el watcher ya no está
  }
}

function die(): never {
  process.kill(process.pid, 'SIGKILL');
  process.exit(1);
}

process.once('SIGINT', die);
process.once('SIGTERM', die);

try {
  await listenOnAvailablePort(app, { host: env.HOST, port: env.PORT });
} catch (error) {
  const declined =
    error instanceof ListenPortDeclinedError ||
    (error instanceof Error && error.name === 'ListenPortDeclinedError');
  if (declined) {
    app.log.info(error instanceof Error ? error.message : 'Port is in use; process stopped');
    stopWatchParent();
    die();
  }
  throw error;
}

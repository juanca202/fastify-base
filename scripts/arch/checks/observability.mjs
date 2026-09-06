#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Observability Standards — checks/observability.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR (no por criterio): agrupa los chequeos de todos los
// criterios de cumplimiento (CR) automatizables de este estándar de dominio
// (docs/standards/observability.md).
// =============================================================================
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STANDARD = 'observability';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
let blockingFailures = 0;

function check(cr, enfoque, descripcion, fn) {
  try {
    fn();
    console.log(`PASS ${STANDARD}/${cr} — ${descripcion}`);
  } catch (err) {
    const status = enfoque === 'warning' ? 'WARN' : 'FAIL';
    if (status === 'FAIL') blockingFailures += 1;
    console.log(`${status} ${STANDARD}/${cr} — ${descripcion}`);
    const detail = err?.stdout?.toString?.() || err?.message || '';
    if (detail)
      console.log(
        detail
          .trim()
          .split('\n')
          .map((l) => `     ${l}`)
          .join('\n'),
      );
  }
}

const appSrc = readFileSync(join(repoRoot, 'src', 'app.ts'), 'utf8');
const telemetrySrc = readFileSync(join(repoRoot, 'src', 'telemetry.ts'), 'utf8');

// --- CR-001 (bloqueante) -----------------------------------------------------
// Los logs de aplicación DEBEN ser estructurados vía el logger de Fastify (Pino).
check(
  'CR-001',
  'bloqueante',
  'Los logs de aplicación DEBEN ser estructurados vía el logger de Fastify (Pino)',
  () => {
    if (!/Fastify\s*\(/.test(appSrc)) {
      throw new Error('src/app.ts no instancia Fastify');
    }
    if (!/logger\s*:/.test(appSrc)) {
      throw new Error('src/app.ts no configura logger en Fastify({...})');
    }
  },
);

// --- CR-002 (bloqueante) -----------------------------------------------------
// Las trazas DEBEN emitirse con OpenTelemetry salvo que el SDK esté deshabilitado.
check(
  'CR-002',
  'bloqueante',
  'Las trazas DEBEN emitirse con OpenTelemetry salvo que el SDK esté deshabilitado',
  () => {
    if (!/new\s+NodeSDK\s*\(/.test(telemetrySrc)) {
      throw new Error('src/telemetry.ts no instancia NodeSDK');
    }
    if (!/FastifyOtelInstrumentation/.test(telemetrySrc)) {
      throw new Error('src/telemetry.ts no instancia FastifyOtelInstrumentation');
    }
  },
);

// --- CR-003 (bloqueante) -----------------------------------------------------
// /health y /docs DEBEN quedar fuera del tracing.
check('CR-003', 'bloqueante', '/health y /docs DEBEN quedar fuera del tracing', () => {
  if (!/ignorePaths/.test(telemetrySrc)) {
    throw new Error('src/telemetry.ts no define ignorePaths');
  }
  if (!telemetrySrc.includes('/health')) {
    throw new Error('ignorePaths no incluye /health');
  }
  if (!telemetrySrc.includes('/docs')) {
    throw new Error('ignorePaths no incluye /docs');
  }
});

process.exit(blockingFailures > 0 ? 1 : 0);

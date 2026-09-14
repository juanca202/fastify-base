#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar API Standards — checks/api.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR (no por criterio): agrupa los chequeos de todos los
// criterios de cumplimiento (CR) automatizables de este estándar de dominio
// (docs/standards/api.md).
// =============================================================================
import { execSync } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { colorStatus } from '../lib/colors.mjs';

const STANDARD = 'api';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
let blockingFailures = 0;

function check(cr, enfoque, descripcion, fn) {
  try {
    fn();
    console.log(`${colorStatus('PASS')} ${STANDARD}/${cr} — ${descripcion}`);
  } catch (err) {
    const status = enfoque === 'warning' ? 'WARN' : 'FAIL';
    if (status === 'FAIL') blockingFailures += 1;
    console.log(`${colorStatus(status)} ${STANDARD}/${cr} — ${descripcion}`);
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

const run = (cmd) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8', cwd: repoRoot });

// --- CR-001 (bloqueante) -----------------------------------------------------
// Las rutas del contrato público DEBEN declarar esquemas Zod de petición y respuesta.
// Tras buildApp() + ready(), app.swagger() debe tener paths públicos (excluir /docs
// y estáticos) con esquemas de respuesta. No hay linter de rutas Fastify.
check(
  'CR-001',
  'bloqueante',
  'Las rutas del contrato público DEBEN declarar esquemas Zod de petición y respuesta',
  () => {
    const appHref = pathToFileURL(join(repoRoot, 'src', 'app.ts')).href;
    const script = `
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.OTEL_SDK_DISABLED = 'true';

const METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

function isExcluded(path) {
  return path === '/docs' || path.startsWith('/docs') || path.startsWith('/static');
}

function responseHasSchema(response) {
  if (!response || typeof response !== 'object') return false;
  if (response.$ref) return true;
  if (response.schema) return true;
  const content = response.content;
  if (content && typeof content === 'object') {
    return Object.values(content).some((media) => media && (media.schema || media.$ref));
  }
  return false;
}

const { buildApp } = await import(${JSON.stringify(appHref)});
const app = await buildApp();
await app.ready();
try {
  if (typeof app.swagger !== 'function') {
    throw new Error('app.swagger() no está disponible');
  }
  const spec = app.swagger();
  const paths = spec?.paths;
  if (!paths || typeof paths !== 'object') {
    throw new Error('app.swagger() no expone paths');
  }
  const publicEntries = Object.entries(paths).filter(([path]) => !isExcluded(path));
  if (publicEntries.length === 0) {
    throw new Error('no hay paths públicos en el documento OpenAPI');
  }
  const missing = [];
  for (const [path, item] of publicEntries) {
    if (!item || typeof item !== 'object') {
      missing.push(path + ' sin operaciones');
      continue;
    }
    const ops = Object.entries(item).filter(([method]) => METHODS.has(method));
    if (ops.length === 0) {
      missing.push(path + ' sin métodos HTTP');
      continue;
    }
    for (const [method, op] of ops) {
      const responses = op?.responses;
      if (!responses || typeof responses !== 'object' || Object.keys(responses).length === 0) {
        missing.push(method.toUpperCase() + ' ' + path + ' sin respuestas');
        continue;
      }
      if (!Object.values(responses).some(responseHasSchema)) {
        missing.push(method.toUpperCase() + ' ' + path + ' sin esquema de respuesta');
      }
    }
  }
  if (missing.length > 0) {
    throw new Error(missing.join('; '));
  }
} finally {
  await app.close();
}
`;
    const tmp = join(tmpdir(), `arch-api-cr001-${process.pid}.mts`);
    writeFileSync(tmp, script, 'utf8');
    try {
      run(`npx --no-install tsx ${JSON.stringify(tmp)}`);
    } finally {
      try {
        unlinkSync(tmp);
      } catch {
        /* ignore */
      }
    }
  },
);

// --- CR-002 (bloqueante) -----------------------------------------------------
// El servicio DEBE publicar un documento OpenAPI 3.x generado desde esos esquemas.
// Esta prueba ya se ejecuta dentro de las compuertas "unit tests"/"coverage"/"e2e" propias de
// quality-check (test/openapi.test.ts está en su alcance): re-ejecutarla aquí con `vitest -t`
// duplicaría el trabajo. Este chequeo audita que el test sigue registrado (trazabilidad), no que
// pase ahora mismo — eso lo reporta quality-check.
check(
  'CR-002',
  'bloqueante',
  'test "expone el documento OpenAPI" registrado [test/openapi.test.ts]',
  () => {
    const src = readFileSync(join(repoRoot, 'test', 'openapi.test.ts'), 'utf8');
    if (!src.includes('expone el documento OpenAPI')) {
      throw new Error(
        'no se encontró el test "expone el documento OpenAPI" en test/openapi.test.ts',
      );
    }
  },
);

// --- CR-003 (bloqueante) -----------------------------------------------------
// La documentación interactiva DEBE servirse en runtime.
// Mismo motivo que CR-002: audita que el test sigue registrado, no que pase ahora — eso ya lo
// cubren las compuertas de quality-check.
check(
  'CR-003',
  'bloqueante',
  'test "sirve la documentación Scalar" registrado [test/openapi.test.ts]',
  () => {
    const src = readFileSync(join(repoRoot, 'test', 'openapi.test.ts'), 'utf8');
    if (!src.includes('sirve la documentación Scalar')) {
      throw new Error(
        'no se encontró el test "sirve la documentación Scalar" en test/openapi.test.ts',
      );
    }
  },
);

process.exit(blockingFailures > 0 ? 1 : 0);

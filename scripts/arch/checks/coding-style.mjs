#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Coding Style Standards — checks/coding-style.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR (no por criterio): agrupa los chequeos de todos los
// criterios de cumplimiento (CR) automatizables de este estándar de dominio
// (docs/standards/coding-style.md).
// =============================================================================
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { colorStatus } from '../lib/colors.mjs';

const STANDARD = 'coding-style';
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
// El análisis estático DEBE terminar sin errores.
// `npm run lint` ya es una compuerta propia de quality-check (check "linter"): re-ejecutarla aquí
// duplicaría el trabajo y acoplaría dos compuertas que deben poder correr por separado. Este chequeo
// audita el cableado (el script existe e invoca eslint) y deja que quality-check reporte los errores.
check(
  'CR-001',
  'bloqueante',
  'regla de lint bloqueante activa [package.json script: lint → eslint; eslint.config.js]',
  () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
    const lintScript = pkg.scripts?.lint ?? '';
    if (!/\beslint\b/.test(lintScript)) {
      throw new Error('package.json scripts.lint no invoca eslint');
    }
    if (!existsSync(join(repoRoot, 'eslint.config.js'))) {
      throw new Error('no existe eslint.config.js');
    }
  },
);

// --- CR-002 (bloqueante) -----------------------------------------------------
// El código fuente DEBE cumplir el formateo del proyecto.
check('CR-002', 'bloqueante', 'El código fuente DEBE cumplir el formateo del proyecto', () => {
  run('npm run format:check');
});

process.exit(blockingFailures > 0 ? 1 : 0);

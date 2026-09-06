#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Coding Style Standards — checks/coding-style.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR (no por criterio): agrupa los chequeos de todos los
// criterios de cumplimiento (CR) automatizables de este estándar de dominio
// (docs/standards/coding-style.md).
// =============================================================================
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STANDARD = 'coding-style';
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

const run = (cmd) => execSync(cmd, { stdio: 'pipe', encoding: 'utf8', cwd: repoRoot });

// --- CR-001 (bloqueante) -----------------------------------------------------
// El análisis estático DEBE terminar sin errores.
check('CR-001', 'bloqueante', 'El análisis estático DEBE terminar sin errores', () => {
  run('npm run lint');
});

// --- CR-002 (bloqueante) -----------------------------------------------------
// El código fuente DEBE cumplir el formateo del proyecto.
check('CR-002', 'bloqueante', 'El código fuente DEBE cumplir el formateo del proyecto', () => {
  run('npm run format:check');
});

process.exit(blockingFailures > 0 ? 1 : 0);

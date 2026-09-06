#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Testing Standards — checks/testing.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR (no por criterio): agrupa los chequeos de todos los
// criterios de cumplimiento (CR) automatizables de este estándar de dominio
// (docs/standards/testing.md).
// =============================================================================
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STANDARD = 'testing';
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
// Las pruebas unitarias DEBEN ejecutarse con Vitest.
// Además falla si package.json scripts.test no invoca vitest.
check('CR-001', 'bloqueante', 'Las pruebas unitarias DEBEN ejecutarse con Vitest', () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  const testScript = pkg.scripts?.test ?? '';
  if (!/\bvitest\b/.test(testScript)) {
    throw new Error('package.json scripts.test no invoca vitest');
  }
  run('npm test');
});

// --- CR-002 (bloqueante) -----------------------------------------------------
// La cobertura de líneas DEBE ser ≥ 80%.
check('CR-002', 'bloqueante', 'La cobertura de líneas DEBE ser ≥ 80%', () => {
  run('npm run test:coverage');
});

// --- CR-003 (bloqueante) -----------------------------------------------------
// Los endpoints públicos DEBEN tener pruebas de API.
check('CR-003', 'bloqueante', 'Los endpoints públicos DEBEN tener pruebas de API', () => {
  run('npm run test:api');
});

process.exit(blockingFailures > 0 ? 1 : 0);

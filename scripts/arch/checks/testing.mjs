#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Testing Standards — checks/testing.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR (no por criterio): agrupa los chequeos de todos los
// criterios de cumplimiento (CR) automatizables de este estándar de dominio
// (docs/standards/testing.md).
// =============================================================================
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { colorStatus } from '../lib/colors.mjs';

const STANDARD = 'testing';
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

// --- CR-001 (bloqueante) -----------------------------------------------------
// Las pruebas unitarias DEBEN ejecutarse con Vitest.
// `npm test` ya es la compuerta "unit tests" propia de quality-check: re-ejecutarla aquí duplicaría
// el trabajo. Este chequeo audita el cableado (el script invoca vitest) y deja que quality-check
// reporte si las pruebas pasan.
check('CR-001', 'bloqueante', 'regla de runner Vitest activa [package.json script: test]', () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  const testScript = pkg.scripts?.test ?? '';
  if (!/\bvitest\b/.test(testScript)) {
    throw new Error('package.json scripts.test no invoca vitest');
  }
});

// --- CR-002 (bloqueante) -----------------------------------------------------
// La cobertura de líneas, sentencias, funciones y ramas DEBE ser ≥ 80% en cada dimensión.
// `npm run test:coverage` ya es la compuerta "coverage" propia de quality-check: re-ejecutarla aquí
// duplicaría el trabajo. Este chequeo audita el umbral configurado en vitest.config.ts (cableado),
// no la cobertura real medida — eso lo reporta quality-check.
check(
  'CR-002',
  'bloqueante',
  'umbral de cobertura ≥ 80% configurado en las cuatro dimensiones [vitest.config.ts]',
  () => {
    const vitestConfigSrc = readFileSync(join(repoRoot, 'vitest.config.ts'), 'utf8');
    const missing = [];
    for (const metric of ['lines', 'statements', 'functions', 'branches']) {
      const match = vitestConfigSrc.match(new RegExp(`\\b${metric}\\s*:\\s*(\\d+(?:\\.\\d+)?)`));
      if (!match) {
        missing.push(`${metric}: no configurado`);
        continue;
      }
      if (Number(match[1]) < 80) {
        missing.push(`${metric}: ${match[1]}% (< 80%)`);
      }
    }
    if (missing.length > 0) {
      throw new Error(missing.join('; '));
    }
  },
);

// --- CR-003 (bloqueante) -----------------------------------------------------
// Los endpoints públicos DEBEN tener pruebas de API.
// `npm run test:e2e` ya es la compuerta "e2e" propia de quality-check: re-ejecutarla aquí duplicaría
// el trabajo. Este chequeo audita que el script está cableado a archivos de prueba que existen,
// no que esas pruebas pasen ahora mismo — eso lo reporta quality-check.
check(
  'CR-003',
  'bloqueante',
  'script test:e2e cableado a archivos de prueba existentes [package.json]',
  () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
    const e2eScript = pkg.scripts?.['test:e2e'] ?? '';
    if (!/\bvitest\b/.test(e2eScript)) {
      throw new Error('package.json scripts["test:e2e"] no invoca vitest');
    }
    const testFiles = [...e2eScript.matchAll(/([\w./-]+\.test\.ts)/g)].map((m) => m[1]);
    if (testFiles.length === 0) {
      throw new Error('scripts["test:e2e"] no referencia archivos .test.ts');
    }
    const missing = testFiles.filter((f) => !existsSync(join(repoRoot, f)));
    if (missing.length > 0) {
      throw new Error(`archivos referenciados inexistentes: ${missing.join(', ')}`);
    }
  },
);

process.exit(blockingFailures > 0 ? 1 : 0);

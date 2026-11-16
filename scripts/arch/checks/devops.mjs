#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar DevOps Standards — checks/devops.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR (no por criterio): agrupa los chequeos de todos los
// criterios de cumplimiento (CR) automatizables de este estándar de dominio
// (docs/standards/devops.md).
// =============================================================================
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { colorStatus } from '../lib/colors.mjs';

const STANDARD = 'devops';
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

const ALLOWED_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];

// --- CR-002 (bloqueante) -----------------------------------------------------
// Los mensajes de commit DEBEN seguir Conventional Commits con los tipos permitidos.
// Auditoría estática de la configuración: commitlint.config.{mjs,cjs,js,ts} presente,
// extiende @commitlint/config-conventional y acota los tipos a la lista normativa.
check(
  'CR-002',
  'bloqueante',
  'commitlint configurado con Conventional Commits y tipos permitidos [commitlint.config.*]',
  () => {
    const candidates = [
      'commitlint.config.mjs',
      'commitlint.config.cjs',
      'commitlint.config.js',
      'commitlint.config.ts',
      '.commitlintrc.js',
      '.commitlintrc.cjs',
      '.commitlintrc.mjs',
      '.commitlintrc.json',
    ];
    const found = candidates.find((f) => existsSync(join(repoRoot, f)));
    if (!found) {
      throw new Error(
        'No se encontró commitlint.config.{mjs,cjs,js,ts} ni .commitlintrc.* en la raíz del repo',
      );
    }
    const raw = readFileSync(join(repoRoot, found), 'utf8');
    if (!/@commitlint\/config-conventional/.test(raw)) {
      throw new Error(`${found} no extiende "@commitlint/config-conventional"`);
    }
    for (const t of ALLOWED_TYPES) {
      if (!new RegExp(`['"\`]${t}['"\`]`).test(raw)) {
        throw new Error(`${found} no declara el tipo permitido "${t}" en type-enum`);
      }
    }

    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
    const devDeps = pkg.devDependencies ?? {};
    if (!devDeps['@commitlint/cli']) {
      throw new Error('package.json devDependencies no incluye "@commitlint/cli"');
    }
    if (!devDeps['@commitlint/config-conventional']) {
      throw new Error('package.json devDependencies no incluye "@commitlint/config-conventional"');
    }
  },
);

// --- CR-003 (bloqueante) -----------------------------------------------------
// El proyecto DEBE validar mensajes con commitlint y Husky DEBE engancharlo en commit-msg.
// Auditoría estática: husky como devDependency y hook .husky/commit-msg que invoca commitlint.
check(
  'CR-003',
  'bloqueante',
  'Husky engancha commitlint en commit-msg [.husky/commit-msg + husky devDependency]',
  () => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
    const devDeps = pkg.devDependencies ?? {};
    if (!devDeps.husky) {
      throw new Error('package.json devDependencies no incluye "husky"');
    }
    const hookPath = join(repoRoot, '.husky/commit-msg');
    if (!existsSync(hookPath)) {
      throw new Error('.husky/commit-msg no existe');
    }
    const hook = readFileSync(hookPath, 'utf8');
    if (!/commitlint/.test(hook)) {
      throw new Error('.husky/commit-msg no invoca commitlint');
    }
  },
);

if (blockingFailures > 0) process.exit(1);

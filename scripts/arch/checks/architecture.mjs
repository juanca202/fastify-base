#!/usr/bin/env node
// =============================================================================
// Fitness functions del estándar Architecture Standards — checks/architecture.mjs
// -----------------------------------------------------------------------------
// UN archivo por ESTÁNDAR (no por criterio): agrupa los chequeos de todos los
// criterios de cumplimiento (CR) automatizables de este estándar de dominio
// (docs/standards/architecture.md).
// =============================================================================
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { colorStatus } from '../lib/colors.mjs';

const STANDARD = 'architecture';
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const srcDir = join(repoRoot, 'src');
const modulesDir = join(srcDir, 'modules');
const pluginsDir = join(srcDir, 'plugins');
let blockingFailures = 0;

const relative = (path) => path.replace(`${repoRoot}/`, '');

function walkFiles(dir, onFile) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, onFile);
    else if (entry.isFile()) onFile(full);
  }
}

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

const TECHNICAL_LAYER_DIRS = new Set(['controllers', 'services', 'models', 'routes']);

// --- CR-001 (bloqueante) -----------------------------------------------------
// El código de aplicación NO DEBE organizarse en carpetas de capa técnica en la
// raíz de src/ (controllers/, services/, models/, routes/).
check(
  'CR-001',
  'bloqueante',
  'El código de aplicación NO DEBE organizarse en carpetas de capa técnica en la raíz de src/',
  () => {
    if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) {
      throw new Error('no existe src/');
    }
    const found = readdirSync(srcDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && TECHNICAL_LAYER_DIRS.has(entry.name))
      .map((entry) => `src/${entry.name}/`);
    if (found.length > 0) {
      throw new Error(`carpetas de capa técnica en la raíz: ${found.join(', ')}`);
    }
  },
);

// --- CR-002 (bloqueante) -----------------------------------------------------
// El servicio DEBE separar el entrypoint de proceso de la composition HTTP.
check(
  'CR-002',
  'bloqueante',
  'El servicio DEBE separar el entrypoint de proceso de la composition HTTP',
  () => {
    const serverPath = join(srcDir, 'server.ts');
    const appPath = join(srcDir, 'app.ts');
    if (!existsSync(serverPath)) {
      throw new Error('no existe src/server.ts');
    }
    if (!existsSync(appPath)) {
      throw new Error('no existe src/app.ts');
    }
    const serverSrc = readFileSync(serverPath, 'utf8');
    const appSrc = readFileSync(appPath, 'utf8');
    if (!/export\s+async\s+function\s+buildApp\b/.test(appSrc)) {
      throw new Error('src/app.ts no exporta buildApp');
    }
    if (!/from\s+['"]\.\/app\.js['"]/.test(serverSrc) || !/\bbuildApp\b/.test(serverSrc)) {
      throw new Error('src/server.ts no importa buildApp desde src/app.ts');
    }
    if (!/\.listen\s*\(/.test(serverSrc) && !/\blistenOnAvailablePort\s*\(/.test(serverSrc)) {
      throw new Error('src/server.ts no arranca el proceso HTTP');
    }
    if (/\.listen\s*\(/.test(appSrc)) {
      throw new Error('src/app.ts no debe hacer listen; eso es del entrypoint de proceso');
    }
    if (/from\s+['"]\.\/modules\//.test(serverSrc)) {
      throw new Error('src/server.ts no debe registrar módulos HTTP; eso es de buildApp');
    }
  },
);

// --- CR-003 (bloqueante) -----------------------------------------------------
// Los componentes de negocio DEBEN vivir bajo src/modules/.
check('CR-003', 'bloqueante', 'Los componentes de negocio DEBEN vivir bajo src/modules/', () => {
  if (!existsSync(modulesDir) || !statSync(modulesDir).isDirectory()) {
    throw new Error('no existe src/modules/');
  }
  const components = readdirSync(modulesDir, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory(),
  );
  if (components.length === 0) {
    throw new Error('src/modules/ no contiene componentes');
  }
});

// --- CR-004 (bloqueante) -----------------------------------------------------
// Cada módulo HTTP DEBE registrarse con la opción prefix.
check('CR-004', 'bloqueante', 'Cada módulo HTTP DEBE registrarse con la opción prefix', () => {
  const appPath = join(srcDir, 'app.ts');
  if (!existsSync(appPath)) {
    throw new Error('no existe src/app.ts');
  }
  const appSource = readFileSync(appPath, 'utf8');
  const imported = [
    ...appSource.matchAll(/import\s+(\w+)\s+from\s+['"]\.\/modules\/[^'"]+['"]/g),
  ].map((match) => match[1]);
  if (imported.length === 0) {
    throw new Error('buildApp no importa módulos desde src/modules/');
  }
  const missing = [];
  for (const name of imported) {
    const call = appSource.match(
      new RegExp(`register\\(\\s*${name}\\s*(?:,\\s*\\{([^}]*)\\})?\\s*\\)`),
    );
    if (!call) {
      missing.push(`${name} no se registra`);
      continue;
    }
    if (!call[1] || !/\bprefix\s*:/.test(call[1])) {
      missing.push(`${name} sin prefix`);
    }
  }
  if (missing.length > 0) {
    throw new Error(missing.join('; '));
  }
});

// --- CR-005 (bloqueante) -----------------------------------------------------
// Fastify DEBE quedar confinado al adaptador HTTP; un servicio de módulo, cuando exista, NO DEBE
// importar tipos HTTP de Fastify.
check(
  'CR-005',
  'bloqueante',
  'Fastify DEBE quedar confinado al adaptador HTTP; un servicio de módulo NO DEBE importar tipos HTTP de Fastify',
  () => {
    if (!existsSync(modulesDir)) return;
    const offenders = [];
    walkFiles(modulesDir, (file) => {
      if (!/\.service\.ts$/.test(file)) return;
      const src = readFileSync(file, 'utf8');
      if (/from\s+['"]fastify['"]/.test(src) || /Fastify(Request|Reply|Instance)\b/.test(src)) {
        offenders.push(relative(file));
      }
    });
    if (offenders.length > 0) {
      throw new Error(`servicios que importan tipos HTTP de Fastify: ${offenders.join(', ')}`);
    }
  },
);

// --- CR-006 (bloqueante) -----------------------------------------------------
// Las carpetas de dominio o acceso a datos NO DEBEN crearse vacías.
check(
  'CR-006',
  'bloqueante',
  'Las carpetas de dominio o acceso a datos NO DEBEN crearse vacías',
  () => {
    if (!existsSync(modulesDir)) return;
    const emptyDirs = [];
    const walkDirs = (dir) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      if (entries.length === 0) {
        emptyDirs.push(relative(dir));
        return;
      }
      for (const entry of entries) {
        if (entry.isDirectory()) walkDirs(join(dir, entry.name));
      }
    };
    walkDirs(modulesDir);
    if (emptyDirs.length > 0) {
      throw new Error(`carpetas vacías: ${emptyDirs.join(', ')}`);
    }
  },
);

// --- CR-007 (bloqueante) -----------------------------------------------------
// Los módulos bajo src/modules/ NO DEBEN envolverse con fastify-plugin.
check(
  'CR-007',
  'bloqueante',
  'Los módulos bajo src/modules/ NO DEBEN envolverse con fastify-plugin',
  () => {
    if (!existsSync(modulesDir)) return;
    const offenders = [];
    walkFiles(modulesDir, (file) => {
      if (!file.endsWith('.ts')) return;
      const src = readFileSync(file, 'utf8');
      if (/from\s+['"]fastify-plugin['"]/.test(src)) offenders.push(relative(file));
    });
    if (offenders.length > 0) {
      throw new Error(`módulos envueltos con fastify-plugin: ${offenders.join(', ')}`);
    }
  },
);

// --- CR-008 (bloqueante) -----------------------------------------------------
// Los plugins de infra bajo src/plugins/ DEBEN envolverse con fastify-plugin y NO DEBEN registrar
// rutas de negocio.
check(
  'CR-008',
  'bloqueante',
  'Los plugins de infra bajo src/plugins/ DEBEN envolverse con fastify-plugin y NO DEBEN registrar rutas de negocio',
  () => {
    if (!existsSync(pluginsDir)) {
      throw new Error('no existe src/plugins/');
    }
    const ROUTE_METHODS = /\.(get|post|put|delete|patch|options|head)\s*\(/;
    const missingFp = [];
    const withRoutes = [];
    for (const entry of readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.ts')) continue;
      const src = readFileSync(join(pluginsDir, entry.name), 'utf8');
      if (!/from\s+['"]fastify-plugin['"]/.test(src)) missingFp.push(entry.name);
      if (ROUTE_METHODS.test(src)) withRoutes.push(entry.name);
    }
    const problems = [];
    if (missingFp.length > 0) problems.push(`sin fastify-plugin: ${missingFp.join(', ')}`);
    if (withRoutes.length > 0)
      problems.push(`registran rutas de negocio: ${withRoutes.join(', ')}`);
    if (problems.length > 0) {
      throw new Error(problems.join('; '));
    }
  },
);

// --- CR-009 (bloqueante) -----------------------------------------------------
// Un módulo NO DEBE importar archivos internos de otro módulo.
check('CR-009', 'bloqueante', 'Un módulo NO DEBE importar archivos internos de otro módulo', () => {
  if (!existsSync(modulesDir)) return;
  const moduleNames = readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
  const offenders = [];
  for (const name of moduleNames) {
    walkFiles(join(modulesDir, name), (file) => {
      if (!file.endsWith('.ts')) return;
      const src = readFileSync(file, 'utf8');
      for (const other of moduleNames) {
        if (other === name) continue;
        const pattern = new RegExp(`from\\s+['"](?:\\.\\./)+modules/${other}/`);
        if (pattern.test(src)) {
          offenders.push(`${relative(file)} importa de ${other}`);
        }
      }
    });
  }
  if (offenders.length > 0) {
    throw new Error(offenders.join('; '));
  }
});

process.exit(blockingFailures > 0 ? 1 : 0);

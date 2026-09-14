# Informe de Auditoría de Cumplimiento — 2026-09-14

**Fecha**: 2026-09-14
**Repositorio**: fastify-base (raíz principal)
**Alcance**: 15 criterios en 5 estándares (API Standards, Architecture Standards, Coding Style Standards, Observability Standards, Testing Standards) · todos `Active`, sin exclusiones + AGENTS.md raíz (sin reglas propias en `# Reglas generales`, más allá del contexto de stack)
**Método**: lectura del frontmatter y de la tabla `## Criterios de cumplimiento` de cada estándar en `docs/standards/` y de los `emits` de cada ADR en `docs/adr/`; runner de arquitectura `node scripts/arch/verify.mjs` ejecutado directamente para obtener el detalle por `CR-XXX` (la caché fresca de `quality-check` — `.sdd-devkit/quality-check-run.json`, fingerprint `f274ae43…` — ya confirmaba el mismo resultado agregado: 15 criterios, 0 violaciones). No se corrió el build ni la suite completa de pruebas.
**Veredicto:** ✅ APPROVED

## Resumen

| Prioridad | Cumplido ✅ | Parcial ⚠️ | Incumplido ❌ | No verificable ❔ |
| --------- | :---------: | :--------: | :-----------: | :---------------: |
| 🔴 Alta   |      7      |     0      |       0       |         0         |
| 🟡 Media  |      6      |     0      |       0       |         0         |
| ⚪ Baja   |      2      |     0      |       0       |         0         |

Los 15 criterios de cumplimiento vigentes tienen fitness function propia, registrada en el archivo de checks de su estándar, y las 15 pasan contra el estado actual del repositorio. No hay incumplimientos, desviaciones parciales ni criterios sin poder verificar: la arquitectura documentada (contrato API First, monolito modular con plugins encapsulados por feature, estilo de código, observabilidad y pruebas) coincide con el código real.

---

## 🔴 Prioridad alta

Sin hallazgos.

## 🟡 Prioridad media

Sin hallazgos.

## ⚪ Prioridad baja

Sin hallazgos.

---

## Fitness functions

El runner `scripts/arch/verify.mjs` (Node, acorde al stack del repo) ejecuta los 5 archivos de checks (`scripts/arch/checks/{api,architecture,coding-style,observability,testing}.mjs`) y cubre los 15 criterios automatizables. Resultado conjunto: **15 PASS · 0 WARN · 0 FAIL** — código de salida 0.

### Existentes

| Criterio (CR)        | Enfoque    | Fitness function / herramienta                                                                                                    | Comando ejecutado                            | ¿Registrada? | Resultado |
| -------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------ | --------- |
| api/CR-001           | bloqueante | Script propio: `buildApp()` + `app.swagger()`, valida que cada path público tenga esquema de respuesta                            | `node scripts/arch/verify.mjs api`           | sí           | ✅ PASS   |
| api/CR-002           | bloqueante | Vitest dirigido: `test/openapi.test.ts -t "expone el documento OpenAPI"`                                                          | `node scripts/arch/verify.mjs api`           | sí           | ✅ PASS   |
| api/CR-003           | bloqueante | Vitest dirigido: `test/openapi.test.ts -t "sirve la documentación Scalar"`                                                        | `node scripts/arch/verify.mjs api`           | sí           | ✅ PASS   |
| architecture/CR-001  | bloqueante | Script propio: `readdirSync` sobre `src/` busca `controllers/·services/·models/·routes/`                                          | `node scripts/arch/verify.mjs architecture`  | sí           | ✅ PASS   |
| architecture/CR-002  | bloqueante | Script propio: valida que `src/app.ts` exporte `buildApp` sin `.listen()` y que `src/server.ts` lo importe y sí llame `.listen()` | `node scripts/arch/verify.mjs architecture`  | sí           | ✅ PASS   |
| architecture/CR-003  | bloqueante | Script propio: `src/modules/` existe y contiene al menos un componente                                                            | `node scripts/arch/verify.mjs architecture`  | sí           | ✅ PASS   |
| architecture/CR-004  | bloqueante | Script propio: cada import de `src/modules/*` en `app.ts` se registra con `register(..., { prefix })`                             | `node scripts/arch/verify.mjs architecture`  | sí           | ✅ PASS   |
| coding-style/CR-001  | bloqueante | ESLint: `npm run lint`                                                                                                            | `node scripts/arch/verify.mjs coding-style`  | sí           | ✅ PASS   |
| coding-style/CR-002  | bloqueante | Prettier: `npm run format:check`                                                                                                  | `node scripts/arch/verify.mjs coding-style`  | sí           | ✅ PASS   |
| observability/CR-001 | bloqueante | Script propio: `src/app.ts` instancia `Fastify({ logger: … })`                                                                    | `node scripts/arch/verify.mjs observability` | sí           | ✅ PASS   |
| observability/CR-002 | bloqueante | Script propio: `src/telemetry.ts` instancia `NodeSDK` + `FastifyOtelInstrumentation`                                              | `node scripts/arch/verify.mjs observability` | sí           | ✅ PASS   |
| observability/CR-003 | bloqueante | Script propio: `src/telemetry.ts` define `ignorePaths` incluyendo `/health` y `/docs`                                             | `node scripts/arch/verify.mjs observability` | sí           | ✅ PASS   |
| testing/CR-001       | bloqueante | Script propio + Vitest: `package.json#scripts.test` invoca `vitest`, luego `npm test`                                             | `node scripts/arch/verify.mjs testing`       | sí           | ✅ PASS   |
| testing/CR-002       | bloqueante | Vitest coverage-v8: `npm run test:coverage` (umbral 80% en líneas/statements/funciones/ramas, `vitest.config.ts`)                 | `node scripts/arch/verify.mjs testing`       | sí           | ✅ PASS   |
| testing/CR-003       | bloqueante | Vitest: `npm run test:e2e` (`test/health.test.ts`, `test/openapi.test.ts`)                                                        | `node scripts/arch/verify.mjs testing`       | sí           | ✅ PASS   |

### Sugeridas

Ninguna: todos los criterios aptos ya están cubiertos.

### Criterios no aptos para fitness function

Ninguno: los 15 criterios vigentes están marcados `Automatizable: yes` y tienen chequeo determinista.

## Reglas no verificables por inspección estática

Ninguna.

## Decisiones sin criterio (trazabilidad)

Ninguna: los 6 ADR (`ADR-001` a `ADR-006`) declaran `emits` con al menos un `CR-XXX`, y cada criterio de los 5 estándares cita su ADR de origen.

## Observaciones

Ninguna.

<!-- arch-audit:verdict=APPROVED · generated=2026-09-14 -->

# Fuentes de contexto

- @docs/adr/README.md — Índice de decisiones arquitectónicas <!-- omitir esta línea y la siguiente si este repositorio está clasificado "Solo specs" (siempre el caso del repositorio de especificaciones en modo multi-repo) — nunca recibe estos índices -->
- @docs/standards/README.md — Índice de estándares de arquitectura
- @README.md — Acerca del proyecto

# Reglas generales

<!-- Regla fija del harness: no eliminarla ni reformularla. Las reglas propias del proyecto van debajo. -->
- **Especificaciones archivadas: solo lectura.** Todo lo que está bajo la carpeta de `specification.archivedPath` de `.sdd-devkit/settings.json` (por defecto `docs/specs/archived/`) es trabajo ya cerrado. Se puede leer como contexto, pero no se edita, renombra ni elimina, tampoco para alinearlo con cambios posteriores ni «por consistencia», y aplica aunque no se esté ejecutando ningún skill. Si algo archivado quedó desactualizado o contradice el estado actual, informarlo al usuario sin modificarlo; para retomarlo, el usuario lo desarchiva primero. Únicas excepciones: mover la carpeta completa al archivar o desarchivar a pedido del usuario, y las escrituras que los skills de SDD Devkit definen expresamente (p. ej. el `criteria-coverage.md` de `coverage-verify` o la normalización de formato de `/plugin-migrate`).

<!-- Normas de trabajo para agentes que no son preferencias (MEMORY), decisiones de arquitectura (ADR/estándares) ni stack: convenciones de código, comandos del repo, restricciones operativas. Ejemplo: "Seguir el estilo del código vecino; no reformatear líneas que no formen parte del cambio." -->

# Stack tecnológico

- **Lenguaje:** TypeScript 6 (ESM, `NodeNext`), Node.js ≥ 22
- **API:** Fastify 5, Zod 4 (`@fastify/type-provider-zod`), OpenAPI 3.1 (`@fastify/swagger`), Scalar (`@scalar/fastify-api-reference`)
- **Auth:** punto de enganche en `src/plugins/auth.ts` (sin mecanismo en la base)
- **Persistencia:** punto de enganche en `src/plugins/database.ts` (sin motor en la base)
- **Observabilidad:** Pino (logger de Fastify), OpenTelemetry (`@fastify/otel`, `@opentelemetry/sdk-node`)
- **Config:** dotenv
- **Build:** npm, `tsc` (`tsconfig.build.json`), `tsx` en desarrollo
- **Calidad:** ESLint 10 + Prettier 3
- **Testing:** Vitest 5 (unit + cobertura `@vitest/coverage-v8`, umbral 80% en líneas, sentencias, funciones y ramas) y Fastify `inject` (API, script `test:e2e`)

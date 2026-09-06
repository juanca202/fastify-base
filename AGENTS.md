# Fuentes de contexto

- @.agents/MEMORY.md — Preferencias del proyecto
- @docs/adr/README.md — Índice de decisiones arquitectónicas <!-- omitir esta línea y la siguiente si este repositorio está clasificado "Solo specs" (siempre el caso del repositorio de especificaciones en modo multi-repo) — nunca recibe estos índices -->
- @docs/standards/README.md — Índice de estándares de arquitectura
- README.md — Acerca del proyecto

# Reglas generales

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
- **Testing:** Vitest 5 (unit + cobertura `@vitest/coverage-v8`, umbral de líneas 80%) y Fastify `inject` (API, script `test:api`)

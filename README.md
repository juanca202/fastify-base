# fastify-base

Plantilla API First para construir APIs HTTP con contratos explícitos: los esquemas Zod son la fuente del contrato, se publican como OpenAPI 3.1 y se consultan en Scalar.

Sirve como punto de partida reutilizable — observabilidad con Pino y OpenTelemetry, y una compuerta de calidad con Vitest, ESLint y Prettier — para que un equipo arranque un servicio sin rearmar el esqueleto en cada proyecto. Autenticación y persistencia no vienen implementadas: el kernel deja el punto de enganche en `src/plugins/auth.ts` y `src/plugins/database.ts`.

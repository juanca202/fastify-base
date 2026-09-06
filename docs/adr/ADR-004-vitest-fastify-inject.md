---
id: ADR-004
status: Accepted
last_update: 2026-09-06
deciders: [juanca202]
tags: [vitest, testing, coverage, fastify]
supersedes: null
superseded_by: null
emits: [testing/CR-001, testing/CR-002, testing/CR-003]
---

# ADR-004: Vitest e inject de Fastify para pruebas

## Contexto

La plantilla necesita una pirámide de pruebas que cubra lógica de aplicación y el contrato HTTP sin levantar un servidor de red. Un runner distinto para unitarias y para API fragmenta la experiencia y obliga a dos toolchains.

También hace falta un umbral de cobertura que evite que el esqueleto se vacíe de pruebas al reutilizarlo.

## Decisión

Usar Vitest como runner de pruebas unitarias y `app.inject()` de Fastify para las pruebas de API (sin bind de puerto). La cobertura se mide con `@vitest/coverage-v8`. El script `test:api` agrupa las pruebas de endpoints públicos.

El código ya implementa esta decisión.

## Consecuencias

### Positivas

- Un solo runner (Vitest) cubre unitarias, API y cobertura.
- `inject` ejercita el stack HTTP de Fastify en proceso, más rápido y determinista que un listen real.
- El umbral de líneas mantiene una compuerta cuantitativa al reutilizar la plantilla.

### Negativas / trade-offs

- `inject` no sustituye pruebas contra un proceso desplegado (red, TLS, proxies).
- El umbral de cobertura puede empujar tests superficiales si se persigue el número sin comportamiento.

## Referencias

- [Testing Standards](../standards/testing.md)
- [Vitest](https://vitest.dev/)
- [Fastify inject](https://fastify.dev/docs/latest/Guides/Testing/)

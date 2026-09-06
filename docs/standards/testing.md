---
name: Testing Standards
domain: testing
status: Active
last_update: 2026-09-06
source_adrs: [ADR-004]
tags: [testing, vitest, coverage]
---

# Testing Standards

Normas de verificación automatizada: pruebas unitarias, umbral de cobertura y pruebas de API. Aplica a `test/` y a los scripts de prueba del repositorio.

## Pruebas unitarias

**ID:** unit-testing
**Estado:** Active

Las pruebas unitarias se ejecutan con el runner del proyecto y miden cobertura de líneas. Las pruebas unitarias **DEBEN** ejecutarse con Vitest. La cobertura de líneas **DEBE** ser ≥ 80%.

### Excepciones

`src/server.ts` y `src/telemetry.ts` quedan fuera del umbral de cobertura: son arranque de proceso e inicialización de telemetría.

## Pruebas de API

**ID:** api-testing
**Estado:** Active

Los endpoints del contrato público se ejercitan contra la aplicación en proceso (sin bind de puerto). Los endpoints públicos **DEBEN** tener pruebas de API.

### Excepciones

Ninguna.

## Criterios de cumplimiento

| ID     | Requisito    | Descripción                                           | Origen                                             | Automatizable | Enfoque    | Verificación |
| ------ | ------------ | ----------------------------------------------------- | -------------------------------------------------- | ------------- | ---------- | ------------ |
| CR-001 | unit-testing | Las pruebas unitarias **DEBEN** ejecutarse con Vitest | [ADR-004](../adr/ADR-004-vitest-fastify-inject.md) | yes           | bloqueante | yes          |
| CR-002 | unit-testing | La cobertura de líneas **DEBE** ser ≥ 80%             | [ADR-004](../adr/ADR-004-vitest-fastify-inject.md) | yes           | bloqueante | yes          |
| CR-003 | api-testing  | Los endpoints públicos **DEBEN** tener pruebas de API | [ADR-004](../adr/ADR-004-vitest-fastify-inject.md) | yes           | bloqueante | yes          |

## Referencias

- [ADR-004: Vitest e inject de Fastify para pruebas](../adr/ADR-004-vitest-fastify-inject.md)

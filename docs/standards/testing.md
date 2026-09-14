---
name: Testing Standards
domain: testing
status: Active
last_update: 2026-09-14
source_adrs: [ADR-004]
tags: [testing, vitest, coverage]
---

# Testing Standards

Normas de verificación automatizada: pruebas unitarias, umbral de cobertura y pruebas de API. Aplica a `test/` y a los scripts de prueba del repositorio.

## Pruebas unitarias

**ID:** unit-testing
**Estado:** Active

Las pruebas unitarias se ejecutan con el runner del proyecto y miden cobertura de líneas, sentencias, funciones y ramas. Las pruebas unitarias **DEBEN** ejecutarse con Vitest. La cobertura de líneas, sentencias, funciones y ramas **DEBE** ser ≥ 80% en cada dimensión.

### Excepciones

`src/server.ts` y `src/telemetry.ts` quedan fuera del umbral de cobertura: son arranque de proceso e inicialización de telemetría.

## Pruebas de API

**ID:** api-testing
**Estado:** Active

Los endpoints del contrato público se ejercitan contra la aplicación en proceso (sin bind de puerto). Los endpoints públicos **DEBEN** tener pruebas de API.

### Excepciones

Ninguna.

## Criterios de cumplimiento

| ID     | Requisito    | Descripción                                                                                | Automatizable | Enfoque    | Verificación                                                |
| ------ | ------------ | ------------------------------------------------------------------------------------------ | ------------- | ---------- | ----------------------------------------------------------- |
| CR-001 | unit-testing | Las pruebas unitarias **DEBEN** ejecutarse con Vitest                                      | yes           | bloqueante | [checks/testing.mjs](../../scripts/arch/checks/testing.mjs) |
| CR-002 | unit-testing | La cobertura de líneas, sentencias, funciones y ramas **DEBE** ser ≥ 80% en cada dimensión | yes           | bloqueante | [checks/testing.mjs](../../scripts/arch/checks/testing.mjs) |
| CR-003 | api-testing  | Los endpoints públicos **DEBEN** tener pruebas de API                                      | yes           | bloqueante | [checks/testing.mjs](../../scripts/arch/checks/testing.mjs) |

## Referencias

- [ADR-004: Vitest e inject de Fastify para pruebas](../adr/ADR-004-vitest-fastify-inject.md)

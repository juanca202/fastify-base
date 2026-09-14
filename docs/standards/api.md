---
name: API Standards
domain: api
status: Active
last_update: 2026-09-14
source_adrs: [ADR-001]
tags: [api, openapi, zod, scalar]
---

# API Standards

Normas del contrato HTTP público: cómo se modelan las rutas, cómo se publica el documento OpenAPI y cómo se sirve la documentación interactiva. Aplica a las rutas que forman parte del contrato del servicio, no a recursos estáticos ni a la UI de documentación.

## Contrato API First

**ID:** api-first
**Estado:** Active

El contrato público se modela primero y se publica desde esa misma fuente. Las rutas del contrato público **DEBEN** modelarse con Zod y publicarse como OpenAPI; Scalar **DEBE** servir la documentación interactiva.

### Excepciones

La UI de documentación (`/docs`) y los recursos estáticos asociados no forman parte del contrato público. Un GET sin cuerpo no requiere esquema de petición.

## Criterios de cumplimiento

| ID     | Requisito | Descripción                                                                            | Automatizable | Enfoque    | Verificación                                        |
| ------ | --------- | -------------------------------------------------------------------------------------- | ------------- | ---------- | --------------------------------------------------- |
| CR-001 | api-first | Las rutas del contrato público **DEBEN** declarar esquemas Zod de petición y respuesta | yes           | bloqueante | [checks/api.mjs](../../scripts/arch/checks/api.mjs) |
| CR-002 | api-first | El servicio **DEBE** publicar un documento OpenAPI 3.x generado desde esos esquemas    | yes           | bloqueante | [checks/api.mjs](../../scripts/arch/checks/api.mjs) |
| CR-003 | api-first | La documentación interactiva **DEBE** servirse en runtime                              | yes           | bloqueante | [checks/api.mjs](../../scripts/arch/checks/api.mjs) |

## Referencias

- [ADR-001: Contrato API First con Fastify, Zod y OpenAPI 3.1](../adr/ADR-001-api-first-fastify-zod-openapi.md)

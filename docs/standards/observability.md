---
name: Observability Standards
domain: observability
status: Active
last_update: 2026-09-14
source_adrs: [ADR-002]
tags: [observability, pino, opentelemetry]
---

# Observability Standards

Normas de visibilidad en ejecución: logs estructurados y trazas distribuidas. Aplica al arranque del proceso y a las rutas HTTP del servicio.

## Observabilidad de runtime

**ID:** runtime-observability
**Estado:** Active

El servicio expone logs y trazas para diagnosticar el comportamiento en ejecución. Los logs de aplicación **DEBEN** ser estructurados vía el logger de Fastify (Pino). Las trazas **DEBEN** emitirse con OpenTelemetry salvo que el SDK esté deshabilitado. `/health` y `/docs` **DEBEN** quedar fuera del tracing.

### Excepciones

Si `OTEL_SDK_DISABLED=true`, el SDK no arranca y no se emiten trazas. El transporte `pino-pretty` en development no cambia el modelo de logs estructurados en el resto de entornos.

## Criterios de cumplimiento

| ID     | Requisito             | Descripción                                                                         | Automatizable | Enfoque    | Verificación                                                            |
| ------ | --------------------- | ----------------------------------------------------------------------------------- | ------------- | ---------- | ----------------------------------------------------------------------- |
| CR-001 | runtime-observability | Los logs de aplicación **DEBEN** ser estructurados vía el logger de Fastify (Pino)  | yes           | bloqueante | [checks/observability.mjs](../../scripts/arch/checks/observability.mjs) |
| CR-002 | runtime-observability | Las trazas **DEBEN** emitirse con OpenTelemetry salvo que el SDK esté deshabilitado | yes           | bloqueante | [checks/observability.mjs](../../scripts/arch/checks/observability.mjs) |
| CR-003 | runtime-observability | `/health` y `/docs` **DEBEN** quedar fuera del tracing                              | yes           | bloqueante | [checks/observability.mjs](../../scripts/arch/checks/observability.mjs) |

## Referencias

- [ADR-002: Observabilidad de runtime con Pino y OpenTelemetry](../adr/ADR-002-pino-opentelemetry-observabilidad.md)

---
id: ADR-002
status: Accepted
last_update: 2026-09-06
deciders: [juanca202]
tags: [pino, opentelemetry, observability]
supersedes: null
superseded_by: null
emits: [observability/CR-001, observability/CR-002, observability/CR-003]
---

# ADR-002: Observabilidad de runtime con Pino y OpenTelemetry

## Contexto

Un servicio HTTP en producción necesita logs estructurados y trazas para diagnosticar fallos y seguir una petición entre componentes. Mezclar `console.log` con un tracer ad hoc produce ruido y no se correlaciona.

Los endpoints de liveness y de documentación no aportan valor de negocio al tracing: incluirlos infla el volumen de spans y oscurece las rutas del contrato.

## Decisión

Usar el logger nativo de Fastify (Pino) para los logs de aplicación y OpenTelemetry para las trazas, con `@fastify/otel`, `NodeSDK` e instrumentaciones automáticas. Health y documentación (`/health`, `/docs`) se excluyen del tracing. El SDK puede deshabilitarse por entorno (`OTEL_SDK_DISABLED`).

El código ya implementa esta decisión.

## Consecuencias

### Positivas

- Los logs salen estructurados por el mismo logger que usa Fastify, listos para recolectores JSON.
- Las trazas siguen el modelo OpenTelemetry y se pueden exportar al backend que configure el SDK.
- Health y docs no saturan el tracing.

### Negativas / trade-offs

- Arrancar el `NodeSDK` añade costo de proceso y requiere configuración de exportadores en cada entorno.
- Si se deshabilita el SDK, no hay trazas; el diagnóstico queda limitado a logs.

## Referencias

- [Observability Standards](../standards/observability.md)
- [Pino](https://getpino.io/)
- [OpenTelemetry](https://opentelemetry.io/)
- [@fastify/otel](https://github.com/fastify/otel)

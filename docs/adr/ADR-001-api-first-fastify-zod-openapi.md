---
id: ADR-001
status: Accepted
last_update: 2026-09-06
deciders: [juanca202]
tags: [fastify, typescript, zod, openapi, scalar, api]
supersedes: null
superseded_by: null
emits: [api/CR-001, api/CR-002, api/CR-003]
---

# ADR-001: Contrato API First con Fastify, Zod y OpenAPI 3.1

## Contexto

El servicio es una API HTTP que otros clientes y equipos consumen. Si el contrato vive solo en el código de las rutas —o se documenta a mano en un artefacto aparte— el documento publicado se desvía del comportamiento real y los consumidores no tienen una fuente única en la que confiar.

Hace falta un enfoque API First: el contrato público se modela primero, se publica en un formato estándar y se consulta en runtime, de modo que implementación y documentación salgan del mismo origen.

## Decisión

Adoptar Fastify con TypeScript y Zod como fuente del contrato público. Los esquemas Zod describen petición y respuesta; `@fastify/swagger` los publica como OpenAPI 3.1; Scalar sirve la documentación interactiva en runtime.

El código ya implementa esta decisión.

## Consecuencias

### Positivas

- Una sola fuente (Zod) alimenta validación, serialización y el documento OpenAPI.
- Los consumidores pueden descubrir el contrato en un documento 3.1 y explorarlo en Scalar sin un proceso de publicación aparte.
- TypeScript y el type provider de Zod alinean el tipado de las rutas con el contrato.

### Negativas / trade-offs

- Toda ruta pública nueva tiene que declarar esquemas Zod; no basta con un handler suelto.
- El documento OpenAPI depende de que `@fastify/swagger` y el transform de Zod estén registrados antes de consultar `swagger()`.

## Referencias

- [API Standards](../standards/api.md)
- [Fastify](https://fastify.dev/)
- [Zod](https://zod.dev/)
- [@fastify/swagger](https://github.com/fastify/fastify-swagger)
- [Scalar](https://github.com/scalar/scalar)
- [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0)

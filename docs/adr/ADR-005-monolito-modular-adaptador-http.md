---
id: ADR-005
status: Accepted
last_update: 2026-09-06
deciders: [juanca202]
tags: [architecture, nodejs, modular-monolith, fastify]
supersedes: null
superseded_by: null
emits: [architecture/CR-001, architecture/CR-002, architecture/CR-003]
---

# ADR-005: Servicio Node.js como monolito modular; Fastify como adaptador HTTP

## Contexto

El repositorio es un proceso Node.js que expone HTTP, observa el runtime y se construye con TypeScript. Tratarlo como «un proyecto Fastify» centra el diseño en el framework web y diluye el resto del proceso: telemetría, configuración y, cuando existan, persistencia y autenticación.

Node.js no prescribe una arquitectura de aplicación. La práctica consolidada para un servicio de este tamaño es un monolito modular operado a lo doce factores: un deploy, un proceso, recorte por capacidad de negocio y el framework HTTP confinado al borde. Las capas técnicas en la raíz (`controllers/`, `services/`, `models/`), un hexagonal completo o un despiece en microservicios no encajan con un template de un solo servicio y un módulo de ejemplo.

ADR-001 ya fija Fastify como vehículo del contrato HTTP (Zod, OpenAPI). No fija dónde vive Fastify respecto al proceso ni cómo se recorta el resto del código.

## Decisión

Organizar el servicio como **monolito modular 12-factor**. Un proceso, un artefacto desplegable. El recorte de aplicación es por componente de negocio (`src/modules/`), no por rol técnico en la raíz.

Fastify es el **adaptador HTTP**: composition en `buildApp` y entry-points de ruta. No es el modelo del proceso. El entrypoint de proceso (`src/server.ts`), la telemetría del runtime, la configuración de entorno y los puntos de enganche de persistencia o autenticación (si el servicio los añade) quedan fuera del modelo Fastify: se registran en el kernel.

Dentro de un módulo, las capas (entry-point HTTP, dominio, acceso a datos) aparecen cuando hay lógica real. No se crean carpetas `domain/` o `data-access/` vacías. Un servicio de módulo, cuando exista, no recibe tipos HTTP.

El código ya implementa el esqueleto de esta decisión.

## Alternativas consideradas

- **Capas técnicas en la raíz** (`controllers/`, `services/`, `models/`): un cambio de negocio toca varias carpetas mezcladas; no hay frontera de módulo.
- **Clean Architecture / hexagonal completo**: misma separación de concerns con más indirección; desproporcionado para handlers triviales de plantilla.
- **Microservicios**: coste operativo sin evidencia de que un solo proceso sea el problema.
- **Tratar el repo como proyecto Fastify**: deja sin dueño el proceso, la telemetría y los jobs que no pasan por HTTP.

## Consecuencias

### Positivas

- El árbol del repo describe un servicio Node, no un framework.
- Un feature nuevo se añade como módulo, no como capa transversal.
- HTTP, colas o CLI pueden compartir dominio sin arrastrar `Request`/`Reply`.
- ADR-001 sigue gobernando el contrato de las rutas; este ADR gobierna el recorte del proceso.

### Negativas / trade-offs

- Hay que distinguir a propósito proceso, kernel y módulos; no todo es un plugin Fastify.
- Hasta que un módulo tenga dominio, la frontera HTTP/dominio es una regla a respetar, no una carpeta visible.
- Extraer un módulo a otro proceso más adelante exige una superficie pública que hoy no hace falta.

## Referencias

- [Architecture Standards](../standards/architecture.md)
- [ADR-001: Contrato API First con Fastify, Zod y OpenAPI 3.1](ADR-001-api-first-fastify-zod-openapi.md)
- [ADR-002: Observabilidad de runtime con Pino y OpenTelemetry](ADR-002-pino-opentelemetry-observabilidad.md)
- [ADR-006: Features como plugins Fastify encapsulados](ADR-006-plugins-encapsulados-por-feature.md)
- [The Twelve-Factor App](https://12factor.net/)
- [nodebestpractices — structure by components / 3-tier](https://github.com/goldbergyoni/nodebestpractices)
- [Martin Fowler — Monolith First](https://martinfowler.com/bliki/MonolithFirst.html)

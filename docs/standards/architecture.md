---
name: Architecture Standards
domain: architecture
status: Active
last_update: 2026-09-06
source_adrs: [ADR-005, ADR-006]
tags: [architecture, modular-monolith, fastify, plugins]
---

# Architecture Standards

Normas de recorte del servicio Node.js: proceso, kernel, módulos de negocio y uso de plugins Fastify en el borde HTTP. Aplica al código de aplicación bajo `src/`, no a `docs/`, `scripts/` ni artefactos de build.

## Monolito modular

**ID:** modular-monolith
**Estado:** Active

El servicio es un proceso Node.js con un solo artefacto desplegable, recortado por capacidad de negocio. El código de aplicación **DEBE** organizarse en componentes bajo `src/modules/`, no en carpetas de capa técnica en la raíz de `src/` (`controllers/`, `services/`, `models/`, `routes/`). El entrypoint de proceso **DEBE** quedar separado de la composition HTTP. Fastify **DEBE** quedar confinado al adaptador HTTP (composition y rutas); un servicio de módulo, cuando exista, **NO DEBE** importar tipos HTTP de Fastify. Las carpetas de dominio o acceso a datos **NO DEBEN** crearse vacías: aparecen cuando el módulo tiene lógica o persistencia propias.

### Excepciones

`src/plugins/`, `src/config/` y `src/types/` son kernel e infra compartida, no componentes de negocio. `health` puede ser solo rutas y schemas. Telemetría y chequeos de arquitectura no pasan por Fastify. Autenticación y persistencia, cuando existan, se enganchan en `src/plugins/auth.ts` y `src/plugins/database.ts`.

## Encapsulación de plugins por feature

**ID:** plugin-encapsulation
**Estado:** Active

Cada feature HTTP es un plugin Fastify. Los módulos bajo `src/modules/` **NO DEBEN** envolverse con `fastify-plugin`. Los plugins de infra bajo `src/plugins/` **DEBEN** envolverse con `fastify-plugin` y **NO DEBEN** registrar rutas de negocio. Un módulo **NO DEBE** importar archivos internos de otro módulo. La composition HTTP **DEBE** registrar cada módulo con `prefix` y rutas relativas al prefijo.

### Excepciones

Los puntos de enganche de autenticación y persistencia (`src/plugins/auth.ts`, `src/plugins/database.ts`) viven en el kernel a propósito; la base no implementa mecanismo ni motor. Un `register` anidado dentro de un módulo (rutas públicas vs autenticadas) no usa `fastify-plugin`. `@fastify/autoload` no es obligatorio.

## Criterios de cumplimiento

| ID     | Requisito            | Descripción                                                                                                                                          | Origen                                                        | Automatizable | Enfoque    | Verificación |
| ------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------- | ---------- | ------------ |
| CR-001 | modular-monolith     | El código de aplicación **NO DEBE** organizarse en carpetas de capa técnica en la raíz de `src/` (`controllers/`, `services/`, `models/`, `routes/`) | [ADR-005](../adr/ADR-005-monolito-modular-adaptador-http.md)  | yes           | bloqueante | yes          |
| CR-002 | modular-monolith     | El servicio **DEBE** separar el entrypoint de proceso de la composition HTTP                                                                         | [ADR-005](../adr/ADR-005-monolito-modular-adaptador-http.md)  | yes           | bloqueante | yes          |
| CR-003 | modular-monolith     | Los componentes de negocio **DEBEN** vivir bajo `src/modules/`                                                                                       | [ADR-005](../adr/ADR-005-monolito-modular-adaptador-http.md)  | yes           | bloqueante | yes          |
| CR-004 | plugin-encapsulation | Cada módulo HTTP **DEBE** registrarse con la opción `prefix`                                                                                         | [ADR-006](../adr/ADR-006-plugins-encapsulados-por-feature.md) | yes           | bloqueante | yes          |

## Referencias

- [ADR-005: Servicio Node.js como monolito modular; Fastify como adaptador HTTP](../adr/ADR-005-monolito-modular-adaptador-http.md)
- [ADR-006: Features como plugins Fastify encapsulados](../adr/ADR-006-plugins-encapsulados-por-feature.md)

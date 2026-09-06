# RS-002 — Arquitectura de un servicio Node.js con Fastify como adaptador HTTP

**Estado:** Ready
**Flujo:** Investigación libre
**Artefacto referenciado:** N/A
**Creado por:** juanca202
**Fecha:** 2026-09-06

## Pregunta de investigación

¿Cuál es la práctica de arquitectura más consolidada para un servicio Node.js (layout del repo, recorte de módulos y capas) cuando Fastify es solo el adaptador HTTP, y cómo conviene aplicarla a este template?

## Contexto

`fastify-base` es un **proceso Node.js** que expone HTTP con Fastify, persiste con Drizzle/PostgreSQL, observa con Pino y OpenTelemetry y se construye con `tsc`. Fastify no es el proyecto: es una librería del proceso. RS-001 ya cubrió el recorte _dentro_ de Fastify (plugins encapsulados por feature). Esta investigación sube un nivel: qué arquitectura de **servicio Node** es la práctica consolidada, y dónde encaja Fastify en ella.

Node.js no publica una arquitectura de aplicación. La documentación oficial describe el **paquete** (`package.json`, `"type": "module"`, `exports`), no MVC, Clean Architecture ni microservicios.

## Hallazgos

### No hay una arquitectura «oficial» de Node.js; sí hay una práctica consolidada de servicio

La API de Node documenta resolución de módulos y el contrato del paquete ([Modules: Packages](https://nodejs.org/docs/latest/api/packages.html), consultado 2026-09-06). Un servicio HTTP no es un paquete de librería: no necesita `exports` públicos; necesita un entrypoint de proceso (`src/server.ts` → `dist/server.js`).

La práctica que se repite en las fuentes de referencia del ecosistema —no en la spec de Node— es la misma idea con tres nombres:

| Nombre                       | Fuente                                                                                                  | Qué prescribe                                                                                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Component-based / 3-tier** | [nodebestpractices 1.1 y 1.2](https://github.com/goldbergyoni/nodebestpractices) (lista viva, jul 2026) | Recortar por dominio de producto; _dentro_ de cada componente, tres capas: entry-point, domain, data-access. El framework HTTP no sale del entry-point.                                      |
| **Monolito modular**         | Fowler [Monolith First](https://martinfowler.com/bliki/MonolithFirst.html) (2015); consenso 2024–2026   | Un deploy, un proceso, fronteras de módulo reales. Microservicios como extracción posterior, no como default.                                                                                |
| **Twelve-Factor**            | [12factor.net](https://12factor.net/)                                                                   | Cómo se _opera_ el proceso: un codebase, config en el entorno, servicios de respaldo, build≠run, proceso sin estado, port binding, logs como stream, apagado elegante, tareas admin one-off. |

Eso no es Clean Architecture ni NestJS. NestJS es una _implementación_ de módulos + DI; hexagonal/Clean añade puertos, use cases y entidades con más abstracción. [nodebestpractices 1.2](https://raw.githubusercontent.com/goldbergyoni/nodebestpractices/master/sections/projectstructre/createlayers.md) lo dice explícito: el 3-tier es el equilibrio; MVC es demasiado vago; Clean Architecture cobra un precio de complejidad desproporcionado para la mayoría de servicios.

La arquitectura «más estándar» de un **servicio Node.js** es por tanto: **monolito modular operado a lo 12-factor, con 3 capas dentro de cada módulo, y el framework HTTP confinado al entry-point.**

### Tres niveles que no hay que mezclar

```text
Proceso Node (12-factor)          ← telemetry, env, señales, listen, migrate
  └── Composición del servicio    ← app.ts: registra infra + módulos
        ├── Kernel compartido     ← config, db client, jwt, errors, OpenAPI
        └── Módulos de negocio    ← auth, health, (orders…)
              ├── entry-point     ← Fastify: rutas, schemas Zod, hooks HTTP
              ├── domain          ← reglas, sin Request/Reply
              └── data-access     ← Drizzle / queries
```

**Nivel proceso.** Fastify no arranca el proceso: `src/server.ts` carga dotenv, `startTelemetry()` (`src/telemetry.ts`, `NodeSDK` — ADR-002), `buildApp()`, `listen`, SIGINT/SIGTERM. Eso es 12-factor VI (proceso), VII (port binding), IX (disposability) y XI (logs vía Pino). OpenTelemetry es del runtime Node, no de Fastify; `@fastify/otel` es solo una instrumentación más.

**Nivel paquete / layout.** Convención de app Node (no librería):

```text
package.json          # "type": "module", engines, scripts
src/                  # código de aplicación
  server.ts           # entrypoint de proceso
  app.ts              # composition root HTTP
  telemetry.ts
  config/
  plugins/            # kernel / adaptadores de infra
  modules/            # componentes de negocio
  db/                 # schema Drizzle (o reexport de tablas de módulos)
  types/
test/                 # pruebas de API (ADR-004)
dist/                 # artefacto de build (12-factor V)
scripts/              # admin one-off (arch, db:migrate — 12-factor XII)
docs/
```

Este template **ya tiene** ese layout. `lib/` es típico de librerías publicadas; `src/` + `dist/` es el de un servicio compilado. Coherente con `"type": "module"` y `module: NodeNext`.

**Nivel aplicación.** Recorte por **componente de negocio**, no por rol técnico (`controllers/`, `services/`, `models/` en la raíz). Dentro de cada componente, 3-tier. Fastify vive solo en el entry-point: adapta JSON ↔ objetos de dominio, valida (Zod, ADR-001) y responde. El domain no recibe `FastifyRequest`.

RS-001 es el mecanismo Fastify de ese recorte (plugin encapsulado, `fp` solo en infra, `prefix`). Este RS es el mapa del proceso Node en el que ese mecanismo encaja.

### Qué no es el estándar (y por qué aparece en Google)

- **Capas técnicas en la raíz** (`routes/`, `controllers/`, `services/`). Sigue siendo lo que muchos tutoriales Express enseñan. nodebestpractices lo marca como el anti-patrón: un cambio de _orders_ toca cuatro carpetas mezcladas con _users_. Este repo ya no está ahí (`src/modules/auth`, `src/modules/health`).
- **Microservicios.** Fowler: casi todas las historias buenas partieron de un monolito; las que nacieron en microservicios suelen ir mal. Un template de un servicio no justifica red.
- **Clean / hexagonal completo** (puertos, use cases, entities, dto, mappers por feature). Misma separación de concerns, más tipos e indirección. nodebestpractices lo descarta como default. En este template, _auth_ es un handler de demostración: esas carpetas estarían vacías de contenido.
- **NestJS como «la» arquitectura Node.** Es un framework con módulos, guards e inyección. La idea (módulo = bounded context, HTTP en el borde) es la misma; el vehículo aquí es Fastify + plugins, no `@Module()`.

### Encaje de Fastify: un adaptador, no el centro

Getting Started de Fastify ya separa «conector de DB envuelto en `fp`» (infra) de «rutas encapsuladas» (entry-point). En términos 3-tier:

| Capa        | En este repo hoy                                         | Rol de Fastify                                |
| ----------- | -------------------------------------------------------- | --------------------------------------------- |
| Proceso     | `server.ts`, `telemetry.ts`                              | Ninguno hasta `listen` / `close`              |
| Composition | `buildApp` en `app.ts`                                   | Registrar plugins y módulos                   |
| Kernel      | `src/plugins/*` con `fp`, `src/config/env.ts`            | Decorators compartidos (`db`, `authenticate`) |
| Entry-point | `src/modules/*/ *.routes.ts`, `*.schemas.ts`             | Rutas, hooks, Zod, JWT en el borde            |
| Domain      | no existe aún (lógica en el handler de `auth.routes.ts`) | No debería importar Fastify                   |
| Data-access | `src/db/schema.ts` + `app.db`                            | Drizzle, no Fastify                           |

El dominio futuro de un feature se llama desde el handler; se prueba sin `inject`; puede reutilizarse desde un job o un consumer. Si el handler pasa `request` al servicio, se rompe esa frontera (nodebestpractices 1.2, «Otherwise»).

Otros entry-points del mismo proceso Node —cola, cron, CLI `db:migrate`— no pasan por Fastify. Por eso la arquitectura no puede ser «todo es un plugin Fastify»: todo es un **proceso Node**; Fastify es _un_ plugin del proceso.

### Este template vs la práctica consolidada

**Ya alineado**

- Un codebase, un `package.json`, dependencias explícitas (12-factor I–II).
- Config validada con Zod desde el entorno (`src/config/env.ts`, 12-factor III; nodebestpractices 1.4 cita Zod).
- PostgreSQL como backing service; cliente en `plugins/database.ts` (12-factor IV).
- `tsc` → `dist/` distinto de `tsx` en dev (12-factor V).
- Proceso sin sesión in-memory; `listen` + shutdown (VI, VII, IX).
- Pino como stream de logs; OTel en el proceso (XI, ADR-002).
- `scripts` npm para migrate/studio/arch (XII).
- Composition (`app.ts`) separada del proceso (`server.ts`) — el equivalente Node del clásico `app.js` vs `www`.
- Módulos por feature empezados; infra en `plugins/` (RS-001).

**Huecos respecto al modelo (no bloquean un template de dos módulos)**

- No hay capa domain: `auth.routes.ts` mezcla HTTP y regla de credenciales demo e importa `env` entero.
- Tablas Drizzle (`users`) no viven en el módulo `auth`; el kernel de persistencia es correcto (un cliente), la _propiedad_ de tablas aún no.
- No hay superficie pública entre módulos (innecesario con dos módulos que no se llaman).
- Pruebas de API en `test/` (válido y alineado con ADR-004); nodebestpractices a veces coloca tests junto al componente. No hace falta moverlas.
- No hay ADR de «servicio Node = monolito modular». Los ADR cubren contrato HTTP, observabilidad, lint y tests.

Aplicar 3-tier _completo_ ahora sería teatro: health no tiene dominio. La regla útil del template es: **cuando un handler deje de ser trivial, extraer `*.service.ts` sin tipos Fastify**; no crear `entry-points/domain/data-access` vacíos.

## Decisiones pendientes / opciones evaluadas

- **Arquitectura de aplicación** — opciones: capas técnicas en la raíz / monolito modular (componentes + 3-tier interno) / Clean-hexagonal / microservicios; recomendación: **monolito modular con 3-tier interno**. Es lo que nodebestpractices marca como `#strategic`, lo que Fowler recomienda como default, y lo que este repo ya esboza.
- **Dónde vive Fastify** — opciones: el proyecto _es_ Fastify / Fastify es el entry-point HTTP; recomendación: **entry-point y composition HTTP**. Proceso, telemetry, config, persistencia y jobs no son Fastify.
- **Profundidad de capas dentro del módulo** — opciones: handler-only / service al crecer / carpetas 3-tier desde el día uno; recomendación: **service al crecer**, igual que RS-001. Carpetas `domain/` y `data-access/` cuando haya más de un caso de uso o persistencia real, no antes.
- **Kernel compartido** — opciones: `src/plugins` + `src/config` + `src/db` (hoy) / `src/shared` + packages internos con `package.json`; recomendación: **conservar el layout actual**. Extraer packages (nodebestpractices 1.3) cuando haya un segundo servicio que reutilice logger/auth; un template de un proceso no lo necesita.
- **Relación con RS-001** — no hay disyuntiva: RS-001 es el mecanismo Fastify del entry-point; este RS es el mapa del proceso Node. Un ADR de servicio debería citar ambos.

## Conclusión y recomendación

La arquitectura más consolidada para un proyecto Node.js de este tipo **no la define Node ni Fastify**: es un **monolito modular 12-factor**. Un proceso, un deploy, módulos por capacidad de negocio, tres capas _dentro_ del módulo, framework HTTP solo en el borde.

Para `fastify-base`:

1. Tratar el árbol como servicio Node, no como «proyecto Fastify»: `server.ts` / `telemetry.ts` / `config` / `db` / `scripts` son de primera clase.
2. Conservar `src/modules/` como componentes y `src/plugins/` como kernel (RS-001).
3. Confinar Fastify a `app.ts` + `*.routes.ts` + `*.schemas.ts`. Un `*.service.ts` futuro no importa `fastify`.
4. No adoptar Clean Architecture, NestJS ni microservicios como estándar del template.
5. No reorganizar a `entry-points/domain/data-access` hasta que un módulo tenga dominio real; sí documentar la regla para cuando llegue.

Qué evitar: carpetas `controllers/` / `services/` globales; pasar `request`/`reply` al dominio; hacer de Fastify el único modelo mental del repo; extraer microservicios «por si acaso».

## Impacto en el artefacto / próximo paso

N/A — investigación independiente.

Complementa [RS-001](../RS-001-separacion-features-fastify/README.md) (encapsulación Fastify). Handoff: `arch-manage` para un ADR «servicio Node como monolito modular; Fastify como adaptador HTTP del entry-point», que cite este RS y el RS-001. No hace falta un WI de refactor ahora: el layout ya es el esqueleto correcto.

## Fuentes

- [Node.js Modules: Packages](https://nodejs.org/docs/latest/api/packages.html) (docs latest, 2026-09-06)
- [nodebestpractices — 1.1 Structure by business components, 1.2 3-tier](https://github.com/goldbergyoni/nodebestpractices) (jul 2026)
- [nodebestpractices — Layer your app, keep Express within its boundaries](https://raw.githubusercontent.com/goldbergyoni/nodebestpractices/master/sections/projectstructre/createlayers.md)
- [The Twelve-Factor App](https://12factor.net/)
- [Martin Fowler — Monolith First](https://martinfowler.com/bliki/MonolithFirst.html) (2015)
- [Fastify Getting Started](https://fastify.dev/docs/latest/Guides/Getting-Started/) (v5.12.x)
- [RS-001 — Separación de responsabilidades por feature en Fastify 5](../RS-001-separacion-features-fastify/README.md)
- Código: `src/server.ts`, `src/app.ts`, `src/telemetry.ts`, `src/config/env.ts`, `src/plugins/*`, `src/modules/*`, `package.json`
- [ADR-001](../../../adr/ADR-001-api-first-fastify-zod-openapi.md), [ADR-002](../../../adr/ADR-002-pino-opentelemetry-observabilidad.md), [ADR-004](../../../adr/ADR-004-vitest-fastify-inject.md)

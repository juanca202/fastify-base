# RS-001 — Separación de responsabilidades por feature en Fastify 5

**Estado:** Ready
**Flujo:** Investigación libre
**Artefacto referenciado:** N/A
**Creado por:** juanca202
**Fecha:** 2026-09-06

## Pregunta de investigación

¿Cómo conviene organizar la separación de responsabilidades por feature en Fastify 5 —encapsulación de plugins, contexto y layout de módulos— para que cada feature de este template sea independiente, componible y no filtre estado al resto de la app?

## Contexto

`fastify-base` es una plantilla API First (Fastify 5, TypeScript ESM, Zod, OpenAPI 3.1). Ya existe un esqueleto con `src/plugins/` (infra transversal) y `src/modules/` (`health`, `auth`), pero no hay ADR ni estándar que fijen cómo añadir un feature nuevo, qué se encapsula, qué se comparte con `fastify-plugin` ni cómo se nombra el prefijo de rutas.

ADR-001 cubre el contrato Zod/OpenAPI; no cubre el recorte por feature. El código ya usa el mecanismo nativo de Fastify (`register` + `fp`), de forma incompleta respecto a la guía oficial.

## Hallazgos

### El recorte nativo de Fastify es el contexto de encapsulación, no las carpetas

En Fastify «todo es un plugin». Cada `register` crea un **contexto hijo**: decorators, hooks y plugins de ese contexto los heredan los descendientes, no los ancestros ni los hermanos. El árbol es un DAG. Eso es la separación de responsabilidades a runtime: un hook `onRequest` o un `decorate('ordersService', …)` dentro del plugin de _orders_ no existe en _health_.

Fuentes: [Encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/) y [Plugins](https://fastify.dev/docs/latest/Reference/Plugins/) (Fastify latest v5.12.x, consultado 2026-09-06). Getting Started lo formula igual: el conector de base de datos se envuelve con `fastify-plugin` para **romper** encapsulación; las rutas **no**.

La guía oficial de orden de carga, replicable por servicio anidado:

1. plugins del ecosistema
2. plugins propios
3. decorators
4. hooks
5. servicios (rutas / features)

Un feature es un **servicio** en esa lista: un plugin encapsulado que puede repetir el mismo orden hacia adentro (auth local, decorators del feature, hooks, rutas).

### `fastify-plugin` (`fp`) es el interruptor de frontera, no un wrapper genérico

`fp` evita el contexto hijo: decorations y hooks se pegan al padre. Sirve **solo** para utilidades compartidas (JWT, DB, error handler, OpenAPI). Envolver rutas con `fp` tiene dos efectos indeseados: los hooks del feature se vuelven globales y la opción `prefix` de `register` **se ignora**.

Regla operativa:

| Tipo de plugin                     | ¿`fp`?         | ¿Rutas? | ¿`prefix`?                      |
| ---------------------------------- | -------------- | ------- | ------------------------------- |
| Infra compartida (`src/plugins/`)  | Sí, con `name` | No      | No aplica                       |
| Feature (`src/modules/<feature>/`) | No             | Sí      | Sí (`{ prefix: '/<feature>' }`) |

El plugin envuelto con `fp` puede a su vez `register` hijos **sin** `fp`: esos hijos sí quedan encapsulados. Eso permite un plugin compartido (p. ej. JWT) que decora `authenticate` en la raíz, y features que usan ese decorator sin filtrar sus propias rutas.

### Este repo ya parte el árbol, pero el recorte es débil

Comprobado en código:

- `buildApp` (`src/app.ts`) registra primero plugins con `fp` (`errorHandler`, `jwtPlugin`, `databasePlugin`, `openapiPlugin`) y después módulos **sin** `fp` (`healthRoutes`, `authRoutes`). Ese orden coincide con Getting Started.
- `jwt.ts`, `database.ts`, `error-handler.ts` y `openapi.ts` usan `fp(..., { name })` y decoran la instancia raíz (`authenticate`, `db`, `pg`). Correcto para infra.
- `auth.routes.ts` y `health.routes.ts` son `FastifyPluginAsyncZod` sin `fp`. Correcto: cada uno es un contexto hijo.
- Los módulos **no** se registran con `prefix`. Las URLs van hardcodeadas (`/auth/token`, `/health`). El contexto existe, pero el namespacing HTTP no usa el mecanismo nativo.
- La lógica de _auth_ vive en el handler (`auth.routes.ts`: comparación con `env.DEMO_USER_*`, `reply.jwtSign`). No hay servicio del feature; el módulo importa `env` de `src/config/env.ts` en lugar de recibir opciones o un decorator.
- Persistencia: `src/db/schema.ts` concentra `users` fuera del módulo `auth`. Acoplamiento de datos, no de contexto Fastify.
- Tipos: `src/types/fastify.d.ts` aumenta `FastifyInstance` en global. En TypeScript las decorations de un feature **también** aparecerían en el tipo global aunque en runtime estén encapsuladas. Limitación conocida Fastify+TS: el recorte runtime no se refleja en el sistema de tipos.
- OpenAPI: `openapi.ts` lista `tags` `Health` y `Auth` en el documento raíz. Un feature nuevo obliga a tocar ese plugin además de su carpeta.
- No hay ADR ni estándar de layout por feature. No hay investigaciones previas (`docs/specs/research/`, `docs/archive/research/` vacíos).
- Las pruebas de API (`test/auth.test.ts`, `test/health.test.ts`) ejercitan la app completa con `inject`, alineado con ADR-004. No prueban el plugin del feature de forma aislada.

### Layout por feature (vertical slice) vs layout por capa técnica

Patrón que Fastify empuja: **un directorio = un plugin encapsulado**. Comunidad y demos (`@fastify/autoload` con `autoHooks`, templates `src/modules/<feature>`) coinciden.

Layout por capas (`routes/`, `services/`, `controllers/` transversales) rompe el DAG: un hook o decorator en `routes/` no tiene frontera natural y los features se acoplan por imports. En este template el layout por feature **ya está empezado** (`src/modules/auth`, `src/modules/health`); conviene cerrarlo, no sustituirlo.

Estructura objetivo de un feature, compatible con ADR-001 (esquemas Zod en la ruta):

```text
src/modules/orders/
  orders.plugin.ts    # entrada: FastifyPluginAsyncZod, sin fp
  orders.routes.ts    # rutas relativas al prefix
  orders.schemas.ts   # contratos Zod del feature
  orders.service.ts   # opcional, cuando el handler deja de ser trivial
```

Registro en `buildApp`:

```ts
await app.register(ordersPlugin, { prefix: '/orders' });
```

Las rutas declaran `/` y `/:id`, no `/orders`. Auth pública vs autenticada **dentro** del mismo feature: un `register` anidado sin `fp` que haga `addHook('onRequest', app.authenticate)` solo en el hijo. Es el ejemplo oficial `/one` autenticado vs `/two` público.

`@fastify/autoload` (`dirNameRoutePrefix`, `autoHooks.js`) automatiza lo mismo. Con dos módulos, el registro explícito en `app.ts` es más revisable y no añade dependencia. Autoload tiene sentido cuando el número de features hace del wiring un coste (orientativamente ≥ 5). Hay interacciones documentadas entre `dirNameRoutePrefix: false` y `autoHooks` ([issue 453](https://github.com/fastify/fastify-autoload/issues/453)).

### Qué compartir y qué no

**Compartir en la raíz (con `fp`):** logger (ya en Fastify), `db`/`pg`, `authenticate`/`jwt`, error handler, OpenAPI/Scalar, compilers Zod. Varios features los necesitan; romper encapsulación aquí es deliberado.

**No compartir:** hooks de autorización de un recurso, decorations de servicios de un feature, esquemas Zod de un feature, tags OpenAPI de un feature (van en `schema.tags` de cada ruta; el array `tags` de `openapi.ts` es documentación opcional, no requisito de Swagger).

**Persistencia Drizzle:** `drizzle.config.ts` apunta a un schema único. Colocar tablas junto al feature es posible si `src/db/schema.ts` reexporta; no hace falta un Drizzle por plugin. Un cliente SQL por proceso (`database.ts`) es el recorte correcto: la conexión es infra, las tablas son del feature.

**Config:** `env` global está bien para HOST/PORT/JWT_SECRET/DATABASE_URL. Credenciales de demostración de _auth_ (`DEMO_USER_EMAIL`) son del feature; pasarlas como `opts` del plugin o un decorator evitaria que cada módulo importe el objeto `env` entero.

## Decisiones pendientes / opciones evaluadas

- **Unidad de recorte** — opciones: plugin encapsulado por feature / carpetas por capa técnica (routes, services, controllers); recomendación: **plugin encapsulado por feature** porque es el modelo de Fastify (DAG + herencia hacia abajo) y el repo ya lo usa en `src/modules/`.
- **Uso de `fp`** — opciones: `fp` en todo / `fp` solo en infra; recomendación: **`fp` solo en `src/plugins/`**. Envolver features con `fp` filtra hooks y anula `prefix`.
- **Prefijo HTTP** — opciones: path hardcodeado en cada ruta / `{ prefix }` en `register`; recomendación: **`prefix` en el registro** (`/auth`, `/health`, `/orders`). Rutas relativas; versionado futuro (`/v1`) es un prefix padre, no un rename masivo.
- **Carga de módulos** — opciones: `register` explícito en `buildApp` / `@fastify/autoload`; recomendación: **explícito ahora**. Autoload cuando el wiring de `app.ts` sea el cuello de botella, no como convención inicial del template.
- **Lógica de negocio** — opciones: handler-only / service por feature / hexagonal completo; recomendación: **handler delgado + `*.service.ts` cuando deje de ser trivial**. Hexagonal por feature es sobrepeso para una plantilla de dos módulos y no lo exige ADR-001.
- **Auth en features** — opciones: `authenticate` global vía `fp` (hoy) / plugin JWT encapsulado solo en features autenticados; recomendación: **mantener `authenticate` en la raíz** (`plugins/jwt.ts` con `fp`): varios features lo usarán. La frontera fina es el hook `onRequest` **dentro** del plugin del feature (o por ruta, como `GET /auth/me` hoy), no esconder JWT.
- **Tablas Drizzle** — opciones: `src/db/schema.ts` único / tablas junto al módulo + reexport; recomendación: **reexport desde `src/db/schema.ts`** cuando un feature tenga tablas propias, sin multiplicar clientes SQL.

## Conclusión y recomendación

Separar features en Fastify 5 es **un plugin encapsulado por feature**, no una convención de carpetas. `register` sin `fp` aísla hooks y decorations; `fp` se reserva a infra compartida; `prefix` nombra el HTTP del feature.

Para este template:

1. Conservar `src/plugins/` (`fp` + `name`, sin rutas) y `src/modules/<feature>/` (plugin sin `fp`).
2. Registrar cada módulo con `{ prefix: '/<feature>' }` y rutas relativas.
3. Tratar el plugin del feature como frontera: schemas Zod y, si hace falta, service y hooks anidados viven ahí. No importar un módulo desde otro; si hay que compartir, subir a un plugin con `fp` o extraer un módulo de dominio explícito.
4. No adoptar `@fastify/autoload` ni hexagonal por feature en el estado actual.
5. Documentar esta regla en un ADR (hoy no existe); el estándar de coding-style no cubre layout.

Qué evitar: envolver `*.routes.ts` con `fp`; paths absolutos duplicando el prefix; añadir tags OpenAPI de un feature nuevo solo en `openapi.ts` sin `schema.tags` en la ruta; decorations de un feature en `src/types/fastify.d.ts` (el tipo se vuelve global y borra la frontera que el runtime sí respeta).

## Impacto en el artefacto / próximo paso

N/A — investigación independiente.

Handoff recomendado: `arch-manage` para un ADR «módulos como plugins encapsulados» (y, si se quiere vigilarlo, un estándar de layout). El cambio de `prefix` y de paths en `auth`/`health` es un WI pequeño (`work-plan`) cuando se quiera alinear el código con la decisión.

## Fuentes

- [Fastify Encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/) (v5.12.x, 2026-09-06)
- [Fastify Plugins](https://fastify.dev/docs/latest/Reference/Plugins/) (v5.12.x, 2026-09-06)
- [Fastify Getting Started — Your first plugin / Loading order](https://fastify.dev/docs/latest/Guides/Getting-Started/) (v5.12.x, 2026-09-06)
- [Fastify Route Prefixing](https://fastify.dev/docs/latest/Reference/Routes/#route-prefixing)
- [fastify-plugin](https://github.com/fastify/fastify-plugin)
- [@fastify/autoload](https://github.com/fastify/fastify-autoload) (`dirNameRoutePrefix`, `autoHooks`)
- Código del repo: `src/app.ts` (`buildApp`), `src/plugins/*.ts`, `src/modules/auth/auth.routes.ts`, `src/modules/health/health.routes.ts`, `src/types/fastify.d.ts`, `src/db/schema.ts`
- [ADR-001](../../../adr/ADR-001-api-first-fastify-zod-openapi.md), [ADR-004](../../../adr/ADR-004-vitest-fastify-inject.md)

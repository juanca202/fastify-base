---
id: ADR-006
status: Accepted
last_update: 2026-09-06
deciders: [juanca202]
tags: [architecture, fastify, plugins, encapsulation]
supersedes: null
superseded_by: null
emits: [architecture/CR-004]
---

# ADR-006: Features como plugins Fastify encapsulados

## Contexto

Fastify recorta responsabilidades en runtime con `register`: cada plugin abre un contexto hijo; decorators y hooks heredan hacia abajo, no hacia hermanos ni hacia el padre. `fastify-plugin` (`fp`) rompe esa frontera a propósito para que la infra compartida sea visible en toda la app.

Si las rutas de un feature se envuelven con `fp`, sus hooks se vuelven globales y la opción `prefix` de `register` deja de aplicar. Si la infra compartida (OpenAPI, y más adelante autenticación o persistencia) no usa `fp`, las decorations no llegan a los módulos.

ADR-005 sitúa Fastify como adaptador HTTP del monolito. Falta fijar cómo se usa el mecanismo nativo de plugins para que cada feature sea un contexto encapsulado y la infra se comparta sin filtrar estado entre módulos.

## Decisión

Cada feature HTTP es un **plugin encapsulado** bajo `src/modules/<feature>/`, **sin** `fp`. La infra compartida vive en `src/plugins/` y **sí** se envuelve con `fp` (con `name`), sin registrar rutas de negocio.

El orden de carga en la composition HTTP es: plugins de infra, después módulos. Un módulo no importa internals de otro; si hay que compartir, se sube al kernel (`fp`) o se expone una superficie pública explícita.

Autenticación y persistencia, **si el servicio las añade**, se registran en el kernel (`src/plugins/auth.ts`, `src/plugins/database.ts`) con `fp`. La base no implementa un mecanismo concreto: solo deja el punto de enganche. El hook que exija identidad se aplica en el módulo o en la ruta, no escondiendo la estrategia en un contexto que otros features no puedan usar.

El código ya implementa esta decisión en `src/plugins/` y `src/modules/`. El namespacing HTTP se declara con `{ prefix }` en `register`; las rutas del módulo son relativas a ese prefijo.

## Alternativas consideradas

- **Envolver todo con `fp`**: un solo contexto; los hooks de un feature contaminan a los demás y `prefix` no funciona.
- **Encapsular también auth/DB cuando existan**: cada módulo re-registraría infra; más duplicación y peor para features que necesitan el mismo hook de identidad.
- **`@fastify/autoload` como convención inicial**: oculta el wiring con dos módulos; el `register` explícito en `buildApp` es más revisable. Autoload queda para cuando el número de módulos lo justifique.
- **Layout por capas técnicas de rutas** (`src/routes/users`, `src/routes/orders` sin plugin por feature): no aprovecha el DAG de encapsulación.

## Consecuencias

### Positivas

- Un hook o decorator de _orders_ no existe en _health_.
- La infra del kernel (errores, OpenAPI, y auth/persistencia cuando se enganchen) se declara una vez y la heredan los módulos.
- Añadir un feature es añadir un plugin y registrarlo; no hace falta un cargador automático.
- Encaja con ADR-005: el módulo Fastify _es_ el entry-point HTTP del componente de negocio.

### Negativas / trade-offs

- TypeScript aumenta `FastifyInstance` en global: el recorte runtime no se refleja en los tipos.
- Olvidar `prefix` o dejar rutas absolutas duplica el namespacing; el chequeo de arquitectura lo bloquea.
- Un plugin de infra que además registre rutas las sube al contexto padre y rompe la frontera.

## Referencias

- [Architecture Standards](../standards/architecture.md)
- [ADR-005: Servicio Node.js como monolito modular; Fastify como adaptador HTTP](ADR-005-monolito-modular-adaptador-http.md)
- [ADR-001: Contrato API First con Fastify, Zod y OpenAPI 3.1](ADR-001-api-first-fastify-zod-openapi.md)
- [Fastify Encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/)
- [Fastify Plugins](https://fastify.dev/docs/latest/Reference/Plugins/)
- [fastify-plugin](https://github.com/fastify/fastify-plugin)

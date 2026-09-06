import fp from 'fastify-plugin';

/**
 * Punto de enganche del kernel para persistencia.
 * La base no abre conexión ni define esquema. Cuando el servicio lo añada, este
 * plugin (con `fp`) decora el cliente en la instancia raíz (p. ej. `db`) y
 * cierra recursos en `onClose`.
 */
export default fp(
  async () => {
    // Intencionalmente vacío: no hay motor de datos en la plantilla.
  },
  { name: 'database' },
);

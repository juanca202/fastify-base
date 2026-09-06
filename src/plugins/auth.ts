import fp from 'fastify-plugin';

/**
 * Punto de enganche del kernel para autenticación.
 * La base no implementa un mecanismo. Cuando el servicio lo añada, este plugin
 * (con `fp`) decora la instancia raíz para que los módulos hereden el hook
 * (p. ej. `authenticate`) sin filtrar estado entre features.
 */
export default fp(
  async () => {
    // Intencionalmente vacío: no hay estrategia de auth en la plantilla.
  },
  { name: 'auth' },
);

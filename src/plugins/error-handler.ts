import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from '@fastify/type-provider-zod';
import type { FastifyError } from 'fastify';
import fp from 'fastify-plugin';

export default fp(
  async (app) => {
    app.setErrorHandler((error: FastifyError, request, reply) => {
      if (hasZodFastifySchemaValidationErrors(error)) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Request does not match the contract',
          issues: error.validation,
        });
      }

      if (isResponseSerializationError(error)) {
        request.log.error(error, 'response does not match the contract');
        return reply.code(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Response does not match the contract',
        });
      }

      request.log.error(error);
      const statusCode = error.statusCode ?? 500;
      return reply.code(statusCode).send({
        statusCode,
        error: statusCode >= 500 ? 'Internal Server Error' : error.name,
        message: statusCode >= 500 ? 'Internal error' : error.message,
      });
    });
  },
  { name: 'error-handler' },
);

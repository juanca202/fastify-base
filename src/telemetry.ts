import { FastifyOtelInstrumentation } from '@fastify/otel';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

export function startTelemetry(): NodeSDK | undefined {
  if (process.env.OTEL_SDK_DISABLED === 'true') {
    return undefined;
  }

  const sdk = new NodeSDK({
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
      new FastifyOtelInstrumentation({
        registerOnInitialization: true,
        ignorePaths: (opts) =>
          opts.url === '/health' || opts.url.startsWith('/docs') || opts.url.startsWith('/openapi'),
      }),
    ],
  });

  sdk.start();
  return sdk;
}

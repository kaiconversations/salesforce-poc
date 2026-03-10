import cors from '@fastify/cors';
import env from '@fastify/env';
import Fastify, { FastifyError } from 'fastify';
import { configSchema, getConfig, Config, EnvVars } from './config/env';
import servicesPlugin from './plugins/services.plugin';
import healthRoute from './routes/health.route';
import salesforceRoute from './routes/salesforce.route';
import kaiRoute from './routes/kai.route';
import syncRoute from './routes/sync.route';

declare module 'fastify' {
  interface FastifyInstance {
    env: EnvVars;
    config: Config;
  }
}

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    }
  });

  // Load and validate environment variables
  await fastify.register(env, {
    schema: configSchema,
    dotenv: true,
    confKey: 'env'
  });

  // Add structured config to fastify instance
  const config = getConfig(fastify.env);
  fastify.decorate('config', config);

  // Register CORS
  await fastify.register(cors, {
    origin: true // TODO: Configure this properly for production
  });

  // Register services
  await fastify.register(servicesPlugin);

  // Register routes
  await fastify.register(healthRoute);
  await fastify.register(salesforceRoute, { prefix: '/api' });
  await fastify.register(kaiRoute, { prefix: '/api' });
  await fastify.register(syncRoute, { prefix: '/api' });

  // Global error handler
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);

    // Check if it's a Fastify error (has statusCode property)
    const isFastifyError = (err: unknown): err is FastifyError => {
      return typeof err === 'object' && err !== null && 'statusCode' in err;
    };

    const statusCode = isFastifyError(error) ? error.statusCode || 500 : 500;
    const message = error instanceof Error ? error.message : 'Internal Server Error';

    reply.status(statusCode).send({
      error: {
        message,
        statusCode
      }
    });
  });

  return fastify;
}

async function start() {
  try {
    const fastify = await buildServer();
    const port = fastify.config.port;

    await fastify.listen({ port, host: '0.0.0.0' });

    fastify.log.info(`Server listening on http://0.0.0.0:${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  start();
}

export { buildServer };

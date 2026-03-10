import { FastifyPluginAsync } from 'fastify';

const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  });

  fastify.get('/ready', {
    schema: {
      description: 'Readiness check endpoint',
      tags: ['health']
    }
  }, async (request, reply) => {
    // TODO: Add checks for Salesforce and Kai API connectivity
    return { status: 'ready' };
  });
};

export default healthRoute;

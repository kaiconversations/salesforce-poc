import { FastifyPluginAsync } from 'fastify';

const kaiRoute: FastifyPluginAsync = async (fastify) => {
  const kaiApi = fastify.kaiApi;

  // Example proxy endpoints for Kai API
  // Adjust these based on actual Kai API endpoints

  fastify.get('/kai/*', {
    schema: {
      description: 'Proxy GET requests to Kai API',
      tags: ['kai']
    }
  }, async (request, reply) => {
    const path = (request.params as any)['*'];
    const data = await kaiApi.get(`/${path}`, request.query);
    return data;
  });

  fastify.post('/kai/*', {
    schema: {
      description: 'Proxy POST requests to Kai API',
      tags: ['kai']
    }
  }, async (request, reply) => {
    const path = (request.params as any)['*'];
    const data = await kaiApi.post(`/${path}`, request.body);
    return data;
  });

  fastify.put('/kai/*', {
    schema: {
      description: 'Proxy PUT requests to Kai API',
      tags: ['kai']
    }
  }, async (request, reply) => {
    const path = (request.params as any)['*'];
    const data = await kaiApi.put(`/${path}`, request.body);
    return data;
  });

  fastify.patch('/kai/*', {
    schema: {
      description: 'Proxy PATCH requests to Kai API',
      tags: ['kai']
    }
  }, async (request, reply) => {
    const path = (request.params as any)['*'];
    const data = await kaiApi.patch(`/${path}`, request.body);
    return data;
  });

  fastify.delete('/kai/*', {
    schema: {
      description: 'Proxy DELETE requests to Kai API',
      tags: ['kai']
    }
  }, async (request, reply) => {
    const path = (request.params as any)['*'];
    const data = await kaiApi.delete(`/${path}`);
    return data;
  });
};

export default kaiRoute;

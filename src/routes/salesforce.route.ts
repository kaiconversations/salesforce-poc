import { FastifyPluginAsync } from 'fastify';

const salesforceRoute: FastifyPluginAsync = async (fastify) => {
  const salesforceApi = fastify.salesforceApi;

  fastify.get('/salesforce/query', {
    schema: {
      description: 'Execute SOQL query',
      tags: ['salesforce'],
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', description: 'SOQL query string' }
        }
      }
    }
  }, async (request, reply) => {
    const { q } = request.query as { q: string };
    const results = await salesforceApi.query(q);
    return { records: results };
  });

  fastify.get('/salesforce/:objectType/:recordId', {
    schema: {
      description: 'Get a record by ID',
      tags: ['salesforce'],
      params: {
        type: 'object',
        properties: {
          objectType: { type: 'string' },
          recordId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { objectType, recordId } = request.params as { objectType: string; recordId: string };
    const record = await salesforceApi.getRecord(objectType, recordId);
    return record;
  });

  fastify.post('/salesforce/:objectType', {
    schema: {
      description: 'Create a new record',
      tags: ['salesforce'],
      params: {
        type: 'object',
        properties: {
          objectType: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { objectType } = request.params as { objectType: string };
    const result = await salesforceApi.createRecord(objectType, request.body);
    return result;
  });

  fastify.patch('/salesforce/:objectType/:recordId', {
    schema: {
      description: 'Update a record',
      tags: ['salesforce'],
      params: {
        type: 'object',
        properties: {
          objectType: { type: 'string' },
          recordId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { objectType, recordId } = request.params as { objectType: string; recordId: string };
    await salesforceApi.updateRecord(objectType, recordId, request.body);
    return { success: true };
  });

  fastify.delete('/salesforce/:objectType/:recordId', {
    schema: {
      description: 'Delete a record',
      tags: ['salesforce'],
      params: {
        type: 'object',
        properties: {
          objectType: { type: 'string' },
          recordId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { objectType, recordId } = request.params as { objectType: string; recordId: string };
    await salesforceApi.deleteRecord(objectType, recordId);
    return { success: true };
  });
};

export default salesforceRoute;

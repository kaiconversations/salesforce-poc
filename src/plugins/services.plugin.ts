import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { SalesforceAuthService } from '../services/salesforce-auth.service';
import { SalesforceApiService } from '../services/salesforce-api.service';
import { KaiApiService } from '../services/kai-api.service';
import { KaiSyncService } from '../services/kai-sync.service';
import { KaiTransformerService } from '../services/kai-transformer.service';

declare module 'fastify' {
  interface FastifyInstance {
    salesforceAuth: SalesforceAuthService;
    salesforceApi: SalesforceApiService;
    kaiApi: KaiApiService;
    kaiSyncService: KaiSyncService;
    kaiTransformerService: KaiTransformerService;
  }
}

const servicesPlugin: FastifyPluginAsync = async (fastify) => {
  const config = fastify.config;

  // Initialize services
  const salesforceAuth = new SalesforceAuthService(config, fastify.log);
  const salesforceApi = new SalesforceApiService(salesforceAuth, fastify.log);
  const kaiApi = new KaiApiService(config, fastify.log);
  const kaiTransformerService = new KaiTransformerService(fastify.log);
  const kaiSyncService = new KaiSyncService(salesforceApi, fastify.log);

  // Decorate fastify instance
  fastify.decorate('salesforceAuth', salesforceAuth);
  fastify.decorate('salesforceApi', salesforceApi);
  fastify.decorate('kaiApi', kaiApi);
  fastify.decorate('kaiSyncService', kaiSyncService);
  fastify.decorate('kaiTransformerService', kaiTransformerService);
};

export default fp(servicesPlugin);

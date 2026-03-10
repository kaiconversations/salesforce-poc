import { FastifyPluginAsync } from 'fastify';
import * as fs from 'fs/promises';
import * as path from 'path';
import { KaiConversationData } from '../types/kai.types';

const syncRoute: FastifyPluginAsync = async (fastify) => {
  const kaiSyncService = fastify.kaiSyncService;

  /**
   * Sync a single conversation from request body
   */
  fastify.post('/sync/conversation', {
    schema: {
      description: 'Sync a Kai conversation to Salesforce',
      tags: ['sync'],
      body: {
        type: 'object',
        required: ['conversation'],
        properties: {
          conversation: { type: 'object' },
          analysis: { type: 'object' },
          dynamicCoaching: { type: 'object' },
          tags: { type: 'array' }
        }
      }
    }
  }, async (request, reply) => {
    const data = request.body as KaiConversationData;
    const result = await kaiSyncService.syncConversation(data);
    return result;
  });

  /**
   * Sync conversation from local kai-data folder
   */
  fastify.post('/sync/conversation/:id', {
    schema: {
      description: 'Sync a Kai conversation from local data files',
      tags: ['sync'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Conversation ID' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    try {
      // Load data from kai-data folder
      const dataPath = path.join(__dirname, '../../../kai-data');

      const conversationFile = await fs.readFile(path.join(dataPath, 'conversation.json'), 'utf-8');
      const conversation = JSON.parse(conversationFile);

      // Verify conversation ID matches
      if (conversation.id !== id) {
        return reply.status(404).send({
          error: `Conversation ${id} not found in data files`
        });
      }

      // Load additional data files
      let analysis, dynamicCoaching, tags;

      try {
        const analysisFile = await fs.readFile(path.join(dataPath, 'analysis.json'), 'utf-8');
        analysis = JSON.parse(analysisFile);
      } catch (error) {
        fastify.log.debug('Analysis file not found');
      }

      try {
        const coachingFile = await fs.readFile(path.join(dataPath, 'dynamic-coaching.json'), 'utf-8');
        dynamicCoaching = JSON.parse(coachingFile);
      } catch (error) {
        fastify.log.debug('Dynamic coaching file not found');
      }

      try {
        const tagsFile = await fs.readFile(path.join(dataPath, 'tags.json'), 'utf-8');
        tags = JSON.parse(tagsFile);
      } catch (error) {
        fastify.log.debug('Tags file not found');
      }

      const data: KaiConversationData = {
        conversation,
        analysis,
        dynamicCoaching,
        tags
      };

      const result = await kaiSyncService.syncConversation(data);
      return result;

    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to load conversation data');
      return reply.status(500).send({
        error: `Failed to load conversation: ${error.message}`
      });
    }
  });

  /**
   * Sync all conversations from local data
   */
  fastify.post('/sync/all', {
    schema: {
      description: 'Sync all conversations from local kai-data folder',
      tags: ['sync']
    }
  }, async (request, reply) => {
    try {
      const dataPath = path.join(__dirname, '../../../kai-data');

      // For now, we only have one conversation in the sample data
      // In production, this would load multiple conversation files
      const conversationFile = await fs.readFile(path.join(dataPath, 'conversation.json'), 'utf-8');
      const conversation = JSON.parse(conversationFile);

      let analysis, dynamicCoaching, tags;

      try {
        const analysisFile = await fs.readFile(path.join(dataPath, 'analysis.json'), 'utf-8');
        analysis = JSON.parse(analysisFile);
      } catch (error) {
        fastify.log.debug('Analysis file not found');
      }

      try {
        const coachingFile = await fs.readFile(path.join(dataPath, 'dynamic-coaching.json'), 'utf-8');
        dynamicCoaching = JSON.parse(coachingFile);
      } catch (error) {
        fastify.log.debug('Dynamic coaching file not found');
      }

      try {
        const tagsFile = await fs.readFile(path.join(dataPath, 'tags.json'), 'utf-8');
        tags = JSON.parse(tagsFile);
      } catch (error) {
        fastify.log.debug('Tags file not found');
      }

      const conversations: KaiConversationData[] = [{
        conversation,
        analysis,
        dynamicCoaching,
        tags
      }];

      const result = await kaiSyncService.syncConversations(conversations);
      return result;

    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to sync all conversations');
      return reply.status(500).send({
        error: `Failed to sync: ${error.message}`
      });
    }
  });

  /**
   * Preview what would be synced without actually syncing
   */
  fastify.get('/sync/preview/:id', {
    schema: {
      description: 'Preview Salesforce Event and Tasks that would be created',
      tags: ['sync'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    try {
      const dataPath = path.join(__dirname, '../../../kai-data');

      const conversationFile = await fs.readFile(path.join(dataPath, 'conversation.json'), 'utf-8');
      const conversation = JSON.parse(conversationFile);

      if (conversation.id !== id) {
        return reply.status(404).send({
          error: `Conversation ${id} not found`
        });
      }

      let analysis;
      try {
        const analysisFile = await fs.readFile(path.join(dataPath, 'analysis.json'), 'utf-8');
        analysis = JSON.parse(analysisFile);
      } catch (error) {
        fastify.log.debug('Analysis file not found');
      }

      const data: KaiConversationData = { conversation, analysis };

      // Use transformer to preview
      const event = fastify.kaiTransformerService.transformToEvent(data);
      const tasks = fastify.kaiTransformerService.transformToTasks(data);

      return {
        event,
        tasks,
        taskCount: tasks.length
      };

    } catch (error: any) {
      fastify.log.error({ error }, 'Failed to preview');
      return reply.status(500).send({
        error: `Failed to preview: ${error.message}`
      });
    }
  });
};

export default syncRoute;

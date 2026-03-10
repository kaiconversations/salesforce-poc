import { FastifyBaseLogger } from 'fastify';
import { SalesforceApiService } from './salesforce-api.service';
import { KaiTransformerService } from './kai-transformer.service';
import { KaiConversationData } from '../types/kai.types';
import { SalesforceSyncResult } from '../types/salesforce.types';

export class KaiSyncService {
  private transformerService: KaiTransformerService;

  constructor(
    private salesforceApi: SalesforceApiService,
    private logger: FastifyBaseLogger
  ) {
    this.transformerService = new KaiTransformerService(logger);
  }

  /**
   * Sync a Kai conversation to Salesforce (Conversation + Event + Tasks)
   * Order: Create Conversation first, then Event/Tasks link to it via WhatId
   */
  async syncConversation(data: KaiConversationData): Promise<SalesforceSyncResult> {
    const errors: string[] = [];
    let conversationId: string | undefined;
    let eventId: string | undefined;
    const taskIds: string[] = [];

    try {
      // Step 1: Create or update KAI_Conversation__c (primary record)
      const existingConversation = await this.findExistingConversation(data.conversation.id);

      if (existingConversation) {
        this.logger.info({
          kaiConversationId: data.conversation.id,
          salesforceId: existingConversation.Id
        }, 'Conversation already synced, updating');

        // Update existing conversation
        const conversation = this.transformerService.transformToConversation(data);
        await this.salesforceApi.updateRecord('KAI_Conversation__c', existingConversation.Id, conversation);
        conversationId = existingConversation.Id;
      } else {
        // Create new conversation
        this.logger.info({ kaiConversationId: data.conversation.id }, 'Creating new Conversation');
        const conversation = this.transformerService.transformToConversation(data);
        const result = await this.salesforceApi.createRecord('KAI_Conversation__c', conversation);
        conversationId = result.id;
        this.logger.debug({ conversationId }, 'Created Conversation');
      }

      // Step 2: Create Event (links to Conversation via WhatId)
      if (conversationId) {
        try {
          const event = this.transformerService.transformToEvent(data, conversationId);
          const result = await this.salesforceApi.createRecord('Event', event);
          eventId = result.id;
          this.logger.debug({ eventId, linkedTo: conversationId }, 'Created Event');
        } catch (error: any) {
          const errorMsg = `Failed to create event: ${error.message}`;
          this.logger.error({ error }, errorMsg);
          errors.push(errorMsg);
        }

        // Step 3: Create Tasks (link to Conversation via WhatId)
        const tasks = this.transformerService.transformToTasks(data, conversationId);

        for (const task of tasks) {
          try {
            const result = await this.salesforceApi.createRecord('Task', task);
            taskIds.push(result.id);
            this.logger.debug({ taskId: result.id }, 'Created Task');
          } catch (error: any) {
            const errorMsg = `Failed to create task: ${error.message}`;
            this.logger.error({ error }, errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      return {
        success: errors.length === 0,
        conversationId,
        eventId,
        taskIds,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error: any) {
      this.logger.error({ error }, 'Failed to sync conversation');
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Find existing Conversation by Kai Conversation ID
   */
  private async findExistingConversation(kaiConversationId: number): Promise<any> {
    try {
      const query = `SELECT Id, Title__c FROM KAI_Conversation__c WHERE KAI_Conversation_Id__c = ${kaiConversationId} LIMIT 1`;
      const results = await this.salesforceApi.query(query);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.debug({ kaiConversationId }, 'No existing conversation found');
      return null;
    }
  }

  /**
   * Sync multiple conversations in batch
   */
  async syncConversations(conversations: KaiConversationData[]): Promise<{
    results: SalesforceSyncResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    const results: SalesforceSyncResult[] = [];

    for (const conversation of conversations) {
      const result = await this.syncConversation(conversation);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    this.logger.info({
      total: conversations.length,
      successful,
      failed
    }, 'Batch sync completed');

    return {
      results,
      summary: {
        total: conversations.length,
        successful,
        failed
      }
    };
  }
}

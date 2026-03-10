import { FastifyBaseLogger } from 'fastify';
import { KaiConversationData } from '../types/kai.types';
import { SalesforceEvent, SalesforceTask, SalesforceConversation } from '../types/salesforce.types';
import { KaiParserService } from './kai-parser.service';

export class KaiTransformerService {
  private parserService: KaiParserService;

  constructor(private logger: FastifyBaseLogger) {
    this.parserService = new KaiParserService(logger);
  }

  /**
   * Transform Kai conversation data into Salesforce Conversation (custom object)
   * This is the primary record - Events and Tasks will link to this via WhatId
   */
  transformToConversation(data: KaiConversationData): SalesforceConversation {
    const { conversation, analysis, dynamicCoaching } = data;

    // Format DNA metrics as readable text
    let dnaMetrics: string | undefined;
    if (dynamicCoaching?.dynamic_coaching?.conversation?.dna?.conversation_dna_metrics) {
      const metrics = dynamicCoaching.dynamic_coaching.conversation.dna.conversation_dna_metrics;
      dnaMetrics = metrics
        .map(m => `${m.name}: ${(m.share * 100).toFixed(1)}% (${m.count} instances)`)
        .join('\n');
    }

    const salesforceConversation: SalesforceConversation = {
      KAI_Conversation_Id__c: conversation.id,
      Title__c: conversation.title || 'KAI Conversation',
      Conversation_Date__c: conversation.date,
      Full_Summary__c: conversation.summary,
      Full_Coaching_Feedback__c: analysis?.coachingFeedback?.suggestions?.text,
      Conversation_DNA_Metrics__c: dnaMetrics,
      Project__c: conversation.project_display_name,
      Owner_Name__c: conversation.owner_display_name,
      Team_Name__c: conversation.team_display_name
    };

    this.logger.debug({ conversationId: conversation.id }, 'Transformed to Salesforce Conversation');
    return salesforceConversation;
  }

  /**
   * Transform Kai conversation data into Salesforce Event
   * Event will link to Conversation via WhatId
   */
  transformToEvent(data: KaiConversationData, conversationId?: string): SalesforceEvent {
    const { conversation, analysis } = data;

    // Calculate duration and end time
    const duration = this.parserService.calculateDuration(conversation);
    const endDateTime = this.parserService.calculateEndDateTime(conversation.date, duration);

    // Extract coaching metrics
    const metrics = this.parserService.extractCoachingMetrics(analysis);

    const event: SalesforceEvent = {
      Subject: conversation.title || 'KAI Conversation',
      Description: conversation.summary,
      StartDateTime: conversation.date,
      EndDateTime: endDateTime,
      DurationInMinutes: duration,
      // Type: 'Meeting', // Removed - not available in all Salesforce editions
      IsAllDayEvent: false,
      WhatId: conversationId, // Link to KAI_Conversation__c

      // KAI metadata
      Kai_Conversation_Id__c: conversation.id,
      Kai_Project__c: conversation.project_display_name,
      Kai_Owner__c: conversation.owner_display_name,
      Kai_Team__c: conversation.team_display_name,
      Kai_First_Party_Label__c: conversation.first_party_label,
      Kai_Second_Party_Label__c: conversation.second_party_label,
      Kai_Type__c: conversation.type,
      Kai_Language__c: conversation.language,
      Kai_Status__c: conversation.status,

      // Coaching metrics
      Kai_Speaker_Balance__c: metrics.speakerBalance,
      Kai_Clinical_Focus__c: metrics.clinicalFocus,
      Kai_Open_Questions__c: metrics.openQuestions,
      Kai_Closed_Questions__c: metrics.closedQuestions,
      Kai_Coaching_Score__c: metrics.overallScore,
      // Coaching feedback - truncated to 255 chars (Activity object limitation)
      // Full feedback stored in KAI_Conversation__c custom object
      Kai_Coaching_Feedback__c: this.truncateText(
        analysis?.coachingFeedback?.suggestions?.text,
        255
      )
    };

    this.logger.debug({ conversationId: conversation.id }, 'Transformed to Salesforce Event');
    return event;
  }

  /**
   * Transform Kai actions into Salesforce Tasks
   * Tasks will link to Conversation via WhatId
   */
  transformToTasks(data: KaiConversationData, conversationId?: string): SalesforceTask[] {
    const { conversation } = data;
    const actions = this.parserService.parseActions(conversation.summary);

    const tasks: SalesforceTask[] = actions.map((action, index) => {
      // Determine priority based on type
      let priority: SalesforceTask['Priority'] = 'Normal';
      if (action.type === 'missed_action') {
        priority = 'High';
      }

      // Determine status
      let status: SalesforceTask['Status'] = 'Not Started';
      if (action.type === 'missed_action') {
        status = 'Deferred';
      }

      const task: SalesforceTask = {
        Subject: action.description.length > 255
          ? action.description.substring(0, 252) + '...'
          : action.description,
        Description: action.successCriteria
          ? `${action.description}\n\nSuccess Criteria: ${action.successCriteria}`
          : action.description,
        Status: status,
        Priority: priority,
        ActivityDate: action.dueDate ? this.parseDueDate(action.dueDate) : undefined,
        WhatId: conversationId, // Link to KAI_Conversation__c

        // KAI metadata
        Kai_Action_Type__c: this.mapActionType(action.type),
        Kai_Success_Criteria__c: action.successCriteria,
        Kai_Conversation_Id__c: conversation.id,
        Kai_Action_Number__c: index + 1
      };

      return task;
    });

    this.logger.debug({
      conversationId: conversation.id,
      taskCount: tasks.length
    }, 'Transformed actions to Salesforce Tasks');

    return tasks;
  }

  /**
   * Map Kai action type to Salesforce picklist value
   */
  private mapActionType(type: string): 'Rep Action' | 'HCP Commitment' | 'Missed Action' {
    switch (type) {
      case 'rep_action':
        return 'Rep Action';
      case 'hcp_commitment':
        return 'HCP Commitment';
      case 'missed_action':
        return 'Missed Action';
      default:
        return 'Rep Action';
    }
  }

  /**
   * Parse due date from text (e.g., "Ahead of the event", "Event day", "2025-12-01")
   */
  private parseDueDate(dueDateText: string): string | undefined {
    // Try to parse as ISO date first
    if (/^\d{4}-\d{2}-\d{2}/.test(dueDateText)) {
      return dueDateText.split('T')[0];
    }

    // For relative dates, we could set a default offset
    // For now, return undefined and let Salesforce handle it
    return undefined;
  }

  /**
   * Truncate text to specified length with ellipsis
   * Used for Activity object fields which have strict length limits
   */
  private truncateText(text: string | undefined, maxLength: number): string | undefined {
    if (!text) return undefined;
    if (text.length <= maxLength) return text;

    // Truncate and add ellipsis
    return text.substring(0, maxLength - 3) + '...';
  }
}

// Salesforce Event mapping for Kai Conversation
export interface SalesforceEvent {
  Subject: string;
  Description: string;
  StartDateTime: string;
  EndDateTime?: string;
  DurationInMinutes?: number;
  Type: string;
  IsAllDayEvent?: boolean;
  WhatId?: string; // Links to KAI_Conversation__c
  // Custom fields
  Kai_Conversation_Id__c?: number;
  Kai_Project__c?: string;
  Kai_Owner__c?: string;
  Kai_Team__c?: string;
  Kai_First_Party_Label__c?: string;
  Kai_Second_Party_Label__c?: string;
  Kai_Type__c?: string;
  Kai_Language__c?: string;
  Kai_Status__c?: string;
  // Coaching metrics
  Kai_Speaker_Balance__c?: string;
  Kai_Clinical_Focus__c?: string;
  Kai_Open_Questions__c?: number;
  Kai_Closed_Questions__c?: number;
  Kai_Coaching_Score__c?: number;
  Kai_Coaching_Feedback__c?: string; // Truncated summary (255 chars)
}

// Salesforce Task mapping for Kai Actions
export interface SalesforceTask {
  Subject: string;
  Description?: string;
  Status: 'Not Started' | 'In Progress' | 'Completed' | 'Deferred';
  Priority: 'High' | 'Normal' | 'Low';
  ActivityDate?: string;
  WhatId?: string; // Links to KAI_Conversation__c
  // Custom fields
  Kai_Action_Type__c?: 'Rep Action' | 'HCP Commitment' | 'Missed Action';
  Kai_Success_Criteria__c?: string;
  Kai_Conversation_Id__c?: number;
  Kai_Action_Number__c?: number;
}

// Custom Object: KAI_Conversation__c
// Primary record that stores all conversation data
// Events and Tasks link to this via WhatId
export interface SalesforceConversation {
  KAI_Conversation_Id__c: number; // External ID for upsert
  Title__c: string; // Conversation title
  Conversation_Date__c: string; // ISO date string
  Full_Summary__c?: string; // Long Text (131KB)
  Full_Coaching_Feedback__c?: string; // Long Text (32KB)
  Conversation_DNA_Metrics__c?: string; // Long Text (32KB)
  Project__c?: string; // Project name
  Owner_Name__c?: string; // Owner display name
  Team_Name__c?: string; // Team display name
}

// Response types
export interface SalesforceSyncResult {
  success: boolean;
  conversationId?: string; // ID of KAI_Conversation__c record
  eventId?: string;
  taskIds?: string[];
  errors?: string[];
}

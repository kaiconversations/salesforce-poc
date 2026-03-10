// Kai Conversation Data Model
export interface KaiConversation {
  id: number;
  date: string;
  title: string;
  description: string;
  summary: string;
  client_id: string;
  client_display_name: string;
  owner_id: string;
  owner_display_name: string;
  project_id: string;
  project_display_name: string;
  team_id: string;
  team_display_name: string;
  type: string;
  language: string;
  first_party_label: string;
  second_party_label: string;
  status: string;
  metadata: Record<string, any>;
  added_on: string;
  updated_on: string;
}

// Kai Analysis/Coaching Data
export interface KaiAnalysis {
  coachingFeedback: {
    suggestions: {
      text: string;
      raw_json: CoachingMetric[];
    };
  };
}

export interface CoachingMetric {
  metric: string;
  outcome: string;
  outcome_type: string;
  score: number;
  support_data: Array<{
    name: string;
    value: string | number;
  }>;
}

// Kai Dynamic Coaching
export interface KaiDynamicCoaching {
  _id: string;
  conversation_id: number;
  dynamic_coaching: {
    conversation: {
      summary: string;
      operator_label: string;
      customer_label: string;
      dna: {
        what: string;
        why: string;
        how: string;
        summary: string;
        conversation_dna_metrics: DNAMetric[];
      };
    };
  };
}

export interface DNAMetric {
  name: string;
  definition: string;
  count: number;
  share: number;
}

// Kai Tags
export interface KaiTag {
  id: number;
  type: string;
  start_time: number;
  end_time: number;
  start_word_index: number;
  end_word_index: number;
  topic_id: number;
  topic_name: string;
  category_name: string;
  categories: string[];
  speaker: string;
  is_dynamic: boolean;
  ai_generated: boolean;
  summary_title: string | null;
  summary_text: string | null;
}

// Parsed Actions from Summary
export interface ParsedAction {
  type: 'rep_action' | 'hcp_commitment' | 'missed_action';
  description: string;
  successCriteria?: string;
  dueDate?: string;
  assignee?: string;
}

// Combined Kai Data
export interface KaiConversationData {
  conversation: KaiConversation;
  analysis?: KaiAnalysis;
  dynamicCoaching?: KaiDynamicCoaching;
  tags?: KaiTag[];
}

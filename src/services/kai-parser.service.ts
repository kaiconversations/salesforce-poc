import { FastifyBaseLogger } from 'fastify';
import { ParsedAction, KaiConversation } from '../types/kai.types';

export class KaiParserService {
  constructor(private logger: FastifyBaseLogger) {}

  /**
   * Parse actions from the conversation summary
   * Extracts Rep actions, HCP commitments, and Missed action points
   */
  parseActions(summary: string): ParsedAction[] {
    const actions: ParsedAction[] = [];

    // Split summary into sections
    const sections = this.splitIntoSections(summary);

    // Parse Rep actions
    if (sections.repActions) {
      const repActions = this.extractActions(
        sections.repActions,
        'rep_action'
      );
      actions.push(...repActions);
    }

    // Parse HCP commitments
    if (sections.hcpCommitments) {
      const hcpActions = this.extractActions(
        sections.hcpCommitments,
        'hcp_commitment'
      );
      actions.push(...hcpActions);
    }

    // Parse Missed action points
    if (sections.missedActions) {
      const missedActions = this.extractActions(
        sections.missedActions,
        'missed_action'
      );
      actions.push(...missedActions);
    }

    this.logger.debug({ actionCount: actions.length }, 'Parsed actions from summary');
    return actions;
  }

  /**
   * Split summary into sections
   */
  private splitIntoSections(summary: string): {
    repActions?: string;
    hcpCommitments?: string;
    missedActions?: string;
  } {
    const sections: any = {};

    // Extract Rep actions section
    const repMatch = summary.match(/Rep actions\s*\n\n([\s\S]*?)(?=\n\n(?:HCP commitments|Missed action points|$))/i);
    if (repMatch) {
      sections.repActions = repMatch[1];
    }

    // Extract HCP commitments section
    const hcpMatch = summary.match(/HCP commitments\s*\n\n([\s\S]*?)(?=\n\nMissed action points|$)/i);
    if (hcpMatch) {
      sections.hcpCommitments = hcpMatch[1];
    }

    // Extract Missed action points section
    const missedMatch = summary.match(/Missed action points\s*\n\n([\s\S]*?)$/i);
    if (missedMatch) {
      sections.missedActions = missedMatch[1];
    }

    return sections;
  }

  /**
   * Extract individual actions from a section
   */
  private extractActions(
    sectionText: string,
    type: ParsedAction['type']
  ): ParsedAction[] {
    const actions: ParsedAction[] = [];

    // Match numbered action items (e.g., "1) Action description...")
    const actionRegex = /(\d+)\)\s+([^.]+(?:\.[^.]+)*?)(?:\s+Success:\s+([^.]+(?:\.[^.]+)*?))?(?:\s+Due:\s+([^.]+))?(?=\n\n\d+\)|$)/gs;

    let match;
    while ((match = actionRegex.exec(sectionText)) !== null) {
      const description = match[2]?.trim();
      const successCriteria = match[3]?.trim();
      const dueDate = match[4]?.trim();

      if (description) {
        actions.push({
          type,
          description,
          successCriteria,
          dueDate
        });
      }
    }

    // If no numbered items found, try bullet points or dashes
    if (actions.length === 0) {
      const lines = sectionText.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
          actions.push({
            type,
            description: trimmed.substring(1).trim()
          });
        }
      }
    }

    return actions;
  }

  /**
   * Extract coaching metrics summary
   */
  extractCoachingMetrics(analysisData?: any): {
    speakerBalance?: string;
    clinicalFocus?: string;
    openQuestions?: number;
    closedQuestions?: number;
    overallScore?: number;
  } {
    if (!analysisData?.coachingFeedback?.suggestions?.raw_json) {
      return {};
    }

    const metrics = analysisData.coachingFeedback.suggestions.raw_json;
    const result: any = {};

    for (const metric of metrics) {
      switch (metric.metric) {
        case 'Speaker balance':
          const operatorValue = metric.support_data.find((d: any) => d.name === 'operator')?.value;
          const customerValue = metric.support_data.find((d: any) => d.name === 'customer')?.value;
          result.speakerBalance = `Operator: ${operatorValue}, Customer: ${customerValue}`;
          break;

        case 'Clinical focus':
          const clinicalValue = metric.support_data.find((d: any) => d.name === 'Clinical')?.value;
          result.clinicalFocus = clinicalValue;
          break;

        case 'Question balance':
          const openQ = metric.support_data.find((d: any) => d.name === 'Open question')?.value;
          const closedQ = metric.support_data.find((d: any) => d.name === 'Closed question')?.value;
          result.openQuestions = typeof openQ === 'string' ? parseInt(openQ) : openQ;
          result.closedQuestions = typeof closedQ === 'string' ? parseInt(closedQ) : closedQ;
          break;
      }
    }

    // Calculate overall score (average of all metric scores)
    const scores = metrics.map((m: any) => m.score).filter((s: number) => s !== 0);
    if (scores.length > 0) {
      result.overallScore = Math.round(
        (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 100
      ) / 100;
    }

    return result;
  }

  /**
   * Calculate meeting duration (default to 30 minutes if not available)
   */
  calculateDuration(conversation: KaiConversation): number {
    // TODO: If Kai provides actual duration, extract it from metadata
    // For now, default to 30 minutes
    return 30;
  }

  /**
   * Format end date/time based on start and duration
   */
  calculateEndDateTime(startDateTime: string, durationMinutes: number): string {
    const start = new Date(startDateTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return end.toISOString();
  }
}

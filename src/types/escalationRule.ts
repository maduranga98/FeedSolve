import type { Timestamp } from 'firebase/firestore';

export type EscalationTriggerType =
  | 'time_since_created'
  | 'time_since_status_change'
  | 'time_unassigned';

export interface EscalationRuleTrigger {
  type: EscalationTriggerType;
  hours: number;
}

export interface EscalationRuleConditions {
  priority?: string[];
  status?: string[];
  boardId?: string | null;
  isUnassigned?: boolean;
}

export interface EscalationRuleActions {
  changePriority?: string;
  changeStatus?: string;
  assignTo?: string;
  notifyEmails?: string[];
  addInternalComment?: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  isActive: boolean;
  trigger: EscalationRuleTrigger;
  conditions: EscalationRuleConditions;
  actions: EscalationRuleActions;
  createdAt: Timestamp;
  lastTriggeredAt: Timestamp | null;
  triggerCount: number;
}

export interface EscalationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Timestamp;
  actionsTaken: string[];
}

export type EscalationRuleInput = Omit<
  EscalationRule,
  'id' | 'createdAt' | 'lastTriggeredAt' | 'triggerCount'
>;

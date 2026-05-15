import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Board, TeamMember } from '../../types';
import type { EscalationRule, EscalationRuleInput, EscalationTriggerType } from '../../types/escalationRule';
import { getRuleSummary } from './RuleCard';

const priorityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const statusOptions = [
  { value: 'received', label: 'Received' },
  { value: 'in_review', label: 'In Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const triggerOptions: Array<{ value: EscalationTriggerType; label: string; preview: string }> = [
  { value: 'time_unassigned', label: 'unassigned for', preview: 'is unassigned for' },
  { value: 'time_since_status_change', label: 'in the same status for', preview: 'stays in the same status for' },
  { value: 'time_since_created', label: 'waiting since created', preview: 'has been waiting since created for' },
];

interface RuleBuilderProps {
  boards: Board[];
  teamMembers: TeamMember[];
  initialRule?: EscalationRule | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (input: EscalationRuleInput) => Promise<void>;
}

function blankRule(): EscalationRuleInput {
  return {
    name: '',
    isActive: true,
    trigger: { type: 'time_unassigned', hours: 2 },
    conditions: { boardId: null, isUnassigned: true },
    actions: { changePriority: 'critical', addInternalComment: 'Escalated automatically after {{hoursWaiting}} hours waiting.' },
  };
}

function fromRule(rule?: EscalationRule | null): EscalationRuleInput {
  if (!rule) return blankRule();
  return {
    name: rule.name,
    isActive: rule.isActive,
    trigger: rule.trigger,
    conditions: rule.conditions,
    actions: rule.actions,
  };
}

function toggleArrayValue(values: string[] | undefined, value: string) {
  const next = new Set(values ?? []);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return Array.from(next);
}

export function RuleBuilder({ boards, teamMembers, initialRule, saving, onClose, onSave }: RuleBuilderProps) {
  const [step, setStep] = useState(1);
  const [rule, setRule] = useState<EscalationRuleInput>(() => fromRule(initialRule));
  const [error, setError] = useState<string | null>(null);

  const previewRule = useMemo(() => ({
    ...rule,
    id: initialRule?.id ?? 'preview',
    createdAt: initialRule?.createdAt,
    lastTriggeredAt: initialRule?.lastTriggeredAt ?? null,
    triggerCount: initialRule?.triggerCount ?? 0,
  } as EscalationRule), [initialRule, rule]);

  const triggerPreview = triggerOptions.find((option) => option.value === rule.trigger.type)?.preview ?? 'matches for';
  const activeActions = [
    rule.actions.changePriority ? `change priority to ${rule.actions.changePriority}` : null,
    rule.actions.changeStatus ? `move status to ${rule.actions.changeStatus.replace(/_/g, ' ')}` : null,
    rule.actions.assignTo ? `assign it to ${rule.actions.assignTo === 'board_owner' ? 'the Board Owner' : teamMembers.find((member) => member.userId === rule.actions.assignTo)?.name ?? 'a teammate'}` : null,
    rule.actions.notifyEmails?.length ? `notify ${rule.actions.notifyEmails.join(', ')}` : null,
    rule.actions.addInternalComment?.trim() ? 'add an internal comment' : null,
  ].filter(Boolean);

  async function handleSave() {
    setError(null);
    if (!rule.name.trim()) {
      setError('Give this rule a clear name so your team understands it.');
      setStep(1);
      return;
    }
    if (!rule.trigger.hours || rule.trigger.hours < 1) {
      setError('Choose at least 1 hour before a rule can trigger.');
      setStep(2);
      return;
    }
    if (activeActions.length === 0) {
      setError('Choose at least one action for this rule to take.');
      setStep(4);
      return;
    }
    await onSave({
      ...rule,
      name: rule.name.trim(),
      actions: {
        ...rule.actions,
        addInternalComment: rule.actions.addInternalComment?.trim() || undefined,
        notifyEmails: rule.actions.notifyEmails?.filter(Boolean),
      },
    });
  }

  const fieldClass = 'mt-1 w-full rounded-lg border border-[#D3D1C7] px-3 py-2 text-sm focus:border-[#2E86AB] focus:outline-none focus:ring-2 focus:ring-[#2E86AB]/20';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E3A5F]/40 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#D3D1C7] bg-white px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#2E86AB]">Step {step} of 5</p>
            <h2 className="text-xl font-bold text-[#1E3A5F]">{initialRule ? 'Edit escalation rule' : 'Create escalation rule'}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[#6B7B8D] hover:bg-[#F1F5F8]">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {error && <div className="mb-4 rounded-lg border border-[#F1C0B8] bg-[#FDECEA] p-3 text-sm text-[#C0392B]">{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[#1E3A5F]">Rule name
                <input className={fieldClass} value={rule.name} onChange={(event) => setRule({ ...rule, name: event.target.value })} placeholder="Escalate unassigned criticals" />
              </label>
              <label className="block text-sm font-semibold text-[#1E3A5F]">Apply to
                <select className={fieldClass} value={rule.conditions.boardId ?? 'all'} onChange={(event) => setRule({ ...rule, conditions: { ...rule.conditions, boardId: event.target.value === 'all' ? null : event.target.value } })}>
                  <option value="all">All boards</option>
                  {boards.map((board) => <option key={board.id} value={board.id}>{board.name}</option>)}
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="font-semibold text-[#1E3A5F]">Trigger when a submission has been...</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
                <select className={fieldClass} value={rule.trigger.type} onChange={(event) => setRule({ ...rule, trigger: { ...rule.trigger, type: event.target.value as EscalationTriggerType }, conditions: { ...rule.conditions, isUnassigned: event.target.value === 'time_unassigned' ? true : rule.conditions.isUnassigned } })}>
                  {triggerOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <input type="number" min={1} className={fieldClass} value={rule.trigger.hours} onChange={(event) => setRule({ ...rule, trigger: { ...rule.trigger, hours: Number(event.target.value) } })} />
                <span className="pb-2 text-sm font-semibold text-[#6B7B8D]">hours</span>
              </div>
              <div className="rounded-xl bg-[#EBF5FB] p-4 text-sm font-medium text-[#1E3A5F]">Triggers when a submission {triggerPreview} {rule.trigger.hours || 0} hour{rule.trigger.hours === 1 ? '' : 's'}.</div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <fieldset><legend className="mb-2 text-sm font-semibold text-[#1E3A5F]">Priority filter</legend><div className="grid gap-2 sm:grid-cols-4">{priorityOptions.map((option) => <label key={option.value} className="rounded-lg border border-[#D3D1C7] px-3 py-2 text-sm"><input type="checkbox" className="mr-2" checked={rule.conditions.priority?.includes(option.value) ?? false} onChange={() => setRule({ ...rule, conditions: { ...rule.conditions, priority: toggleArrayValue(rule.conditions.priority, option.value) } })} />{option.label}</label>)}</div></fieldset>
              <fieldset><legend className="mb-2 text-sm font-semibold text-[#1E3A5F]">Status filter</legend><div className="grid gap-2 sm:grid-cols-3">{statusOptions.map((option) => <label key={option.value} className="rounded-lg border border-[#D3D1C7] px-3 py-2 text-sm"><input type="checkbox" className="mr-2" checked={rule.conditions.status?.includes(option.value) ?? false} onChange={() => setRule({ ...rule, conditions: { ...rule.conditions, status: toggleArrayValue(rule.conditions.status, option.value) } })} />{option.label}</label>)}</div></fieldset>
              <label className="inline-flex items-center gap-2 rounded-lg border border-[#D3D1C7] px-3 py-2 text-sm font-semibold text-[#1E3A5F]"><input type="checkbox" checked={rule.conditions.isUnassigned ?? false} onChange={(event) => setRule({ ...rule, conditions: { ...rule.conditions, isUnassigned: event.target.checked } })} /> Unassigned only</label>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#1E3A5F]">Change priority to<select className={fieldClass} value={rule.actions.changePriority ?? ''} onChange={(event) => setRule({ ...rule, actions: { ...rule.actions, changePriority: event.target.value || undefined } })}><option value="">Do not change</option>{priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="block text-sm font-semibold text-[#1E3A5F]">Change status to<select className={fieldClass} value={rule.actions.changeStatus ?? ''} onChange={(event) => setRule({ ...rule, actions: { ...rule.actions, changeStatus: event.target.value || undefined } })}><option value="">Do not change</option>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="block text-sm font-semibold text-[#1E3A5F]">Assign to<select className={fieldClass} value={rule.actions.assignTo ?? ''} onChange={(event) => setRule({ ...rule, actions: { ...rule.actions, assignTo: event.target.value || undefined } })}><option value="">Do not assign</option><option value="board_owner">Board Owner</option>{teamMembers.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select></label>
              <fieldset className="block text-sm font-semibold text-[#1E3A5F]">Send notification to<div className="mt-1 max-h-36 space-y-1 overflow-y-auto rounded-lg border border-[#D3D1C7] p-2">{teamMembers.map((member) => <label key={member.email} className="flex items-center gap-2 text-sm font-normal text-[#444441]"><input type="checkbox" checked={rule.actions.notifyEmails?.includes(member.email) ?? false} onChange={() => setRule({ ...rule, actions: { ...rule.actions, notifyEmails: toggleArrayValue(rule.actions.notifyEmails, member.email) } })} />{member.email}</label>)}</div></fieldset>
              <label className="block text-sm font-semibold text-[#1E3A5F] sm:col-span-2">Add internal comment<textarea className={`${fieldClass} min-h-28`} value={rule.actions.addInternalComment ?? ''} onChange={(event) => setRule({ ...rule, actions: { ...rule.actions, addInternalComment: event.target.value } })} placeholder="Escalated automatically after {{hoursWaiting}} hours waiting on {{submissionId}}." /><span className="mt-1 block text-xs font-normal text-[#6B7B8D]">Supports {'{{submissionId}}'} and {'{{hoursWaiting}}'} variables.</span></label>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#D3D1C7] bg-[#F1F5F8] p-5">
                <h3 className="font-bold text-[#1E3A5F]">Review this rule</h3>
                <p className="mt-2 text-sm leading-6 text-[#444441]">{getRuleSummary(previewRule)}</p>
                <p className="mt-3 text-sm text-[#6B7B8D]">It will {activeActions.join(', ') || 'take no actions yet'}.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#D3D1C7] bg-[#F1F5F8] px-6 py-4">
          <button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#6B7B8D] disabled:opacity-40">Back</button>
          {step < 5 ? <button type="button" onClick={() => setStep((current) => Math.min(5, current + 1))} className="rounded-lg bg-[#2E86AB] px-4 py-2 text-sm font-semibold text-white">Next</button> : <button type="button" onClick={() => void handleSave()} disabled={saving} className="rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save Rule'}</button>}
        </div>
      </div>
    </div>
  );
}

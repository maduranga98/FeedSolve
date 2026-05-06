import { formatDistanceToNow } from 'date-fns';
import { Edit3, Trash2 } from 'lucide-react';
import type { EscalationRule } from '../../types/escalationRule';

const triggerCopy: Record<EscalationRule['trigger']['type'], string> = {
  time_unassigned: 'unassigned for',
  time_since_status_change: 'in the same status for',
  time_since_created: 'waiting since created for',
};

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()).replace('Medium', 'Normal');
}

export function getRuleSummary(rule: EscalationRule) {
  const pieces = [`Triggers when a submission has been ${triggerCopy[rule.trigger.type]} ${rule.trigger.hours} hour${rule.trigger.hours === 1 ? '' : 's'}`];
  if (rule.conditions.priority?.length) pieces.push(`priority is ${rule.conditions.priority.map(labelize).join(' or ')}`);
  if (rule.conditions.status?.length) pieces.push(`status is ${rule.conditions.status.map(labelize).join(' or ')}`);
  if (rule.conditions.isUnassigned) pieces.push('it is unassigned');
  if (rule.conditions.boardId) pieces.push('on the selected board');
  return pieces.join(', ') + '.';
}

interface RuleCardProps {
  rule: EscalationRule;
  onToggle: (isActive: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function RuleCard({ rule, onToggle, onEdit, onDelete, disabled }: RuleCardProps) {
  const lastTriggered = rule.lastTriggeredAt
    ? `${formatDistanceToNow(rule.lastTriggeredAt.toDate(), { addSuffix: true })}`
    : 'Never';

  return (
    <article className="rounded-xl border border-[#D3D1C7] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[#1E3A5F]">{rule.name}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rule.isActive ? 'bg-[#EAF9F2] text-[#1D8A57]' : 'bg-[#EFF3F6] text-[#6B7B8D]'}`}>
              {rule.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#444441]">{getRuleSummary(rule)}</p>
          <p className="mt-3 text-xs font-medium text-[#6B7B8D]">
            Last triggered: {lastTriggered} · Triggered {rule.triggerCount} time{rule.triggerCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#D3D1C7] bg-[#F8FAFB] px-3 py-2 text-sm font-semibold text-[#1E3A5F]">
            <input
              type="checkbox"
              checked={rule.isActive}
              disabled={disabled}
              onChange={(event) => onToggle(event.target.checked)}
              className="h-4 w-4 rounded border-[#D3D1C7] text-[#2E86AB] focus:ring-[#2E86AB]"
            />
            Active
          </label>
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-[#D3D1C7] px-3 py-2 text-sm font-semibold text-[#2E86AB] hover:bg-[#EBF5FB]">
            <Edit3 size={15} /> Edit
          </button>
          <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-[#F1C0B8] px-3 py-2 text-sm font-semibold text-[#C0392B] hover:bg-[#FDECEA]">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

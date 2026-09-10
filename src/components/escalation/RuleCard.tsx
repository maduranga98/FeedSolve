import { formatDistanceToNow } from 'date-fns';
import { Edit3, Trash2 } from 'lucide-react';
import type { EscalationRule } from '../../types/escalationRule';

const triggerCopy: Record<EscalationRule['trigger']['type'], string> = {
  time_unassigned: 'unassigned for',
  time_since_status_change: 'in the same status for',
  time_since_created: 'waiting since created for',
};

function labelize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
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
    <article className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sffffff)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[var(--c-t1c1917)]">{rule.name}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rule.isActive ? 'bg-[var(--c-seaf9f2)] text-[var(--c-t1d8a57)]' : 'bg-[var(--c-sf1ebe5)] text-[var(--c-t78716c)]'}`}>
              {rule.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--c-t3c3632)]">{getRuleSummary(rule)}</p>
          <p className="mt-3 text-xs font-medium text-[var(--c-t78716c)]">
            Last triggered: {lastTriggered} · Triggered {rule.triggerCount} time{rule.triggerCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] px-3 py-2 text-sm font-semibold text-[var(--c-t1c1917)]">
            <input
              type="checkbox"
              checked={rule.isActive}
              disabled={disabled}
              onChange={(event) => onToggle(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--c-bd6cabf)] text-[var(--c-tc0694a)] focus:ring-[var(--c-bc0694a)]"
            />
            Active
          </label>
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--c-bd6cabf)] px-3 py-2 text-sm font-semibold text-[var(--c-tc0694a)] hover:bg-[var(--c-sf5e6df)]">
            <Edit3 size={15} /> Edit
          </button>
          <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--c-bf1c0b8)] px-3 py-2 text-sm font-semibold text-[var(--c-tc0392b)] hover:bg-[var(--c-sfdecea)]">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>
    </article>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Lock, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../hooks/useAuth';
import { useEscalationRules } from '../../../hooks/useEscalationRules';
import { getCompanyBoards, getTeamMembers } from '../../../lib/firestore';
import type { Board, TeamMember } from '../../../types';
import type { EscalationRule, EscalationRuleInput } from '../../../types/escalationRule';
import { RuleBuilder } from '../../../components/escalation/RuleBuilder';
import { RuleCard } from '../../../components/escalation/RuleCard';
import { LoadingSpinner } from '../../../components/Shared';

export function EscalationRulesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    rules,
    loading,
    saving,
    error,
    tier,
    canUseEscalations,
    activeRuleCount,
    activeRuleLimit,
    createRule,
    updateRule,
    deleteRule,
  } = useEscalationRules();
  const [boards, setBoards] = useState<Board[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<EscalationRule | null>(null);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getCompanyBoards(user.companyId),
      getTeamMembers(user.companyId),
    ]).then(([companyBoards, members]) => {
      setBoards(companyBoards);
      setTeamMembers(members);
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to load boards and team members');
    });
  }, [user]);

  async function handleSave(input: EscalationRuleInput) {
    if (editingRule) {
      await updateRule(editingRule.id, input);
      toast.success(t('escalation.rule_updated'));
    } else {
      await createRule(input);
      toast.success(t('escalation.rule_created'));
    }
    setBuilderOpen(false);
    setEditingRule(null);
  }

  async function handleDelete(rule: EscalationRule) {
    if (!window.confirm(t('escalation.delete_confirm', { name: rule.name }))) return;
    await deleteRule(rule.id);
    toast.success(t('escalation.rule_deleted'));
  }

  const locked = !canUseEscalations;

  return (
    <main className="min-h-screen bg-[#F1F5F8] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#EBF5FB] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2E86AB]">
              <Zap size={14} /> {t('escalation.badge')}
            </div>
            <h1 className="text-3xl font-bold text-[#1E3A5F]">{t('escalation.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7B8D]">
              {t('escalation.description')}
            </p>
          </div>
          <button
            type="button"
            disabled={locked}
            onClick={() => {
              setEditingRule(null);
              setBuilderOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E86AB] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3A5F] disabled:cursor-not-allowed disabled:bg-[#9AABBF]"
          >
            <Plus size={17} /> {t('escalation.new_rule')}
          </button>
        </div>

        {locked && (
          <div className="mb-6 rounded-xl border border-[#F4D7A1] bg-[#FFF8E6] p-5 text-[#7A4B00]">
            <div className="flex gap-3">
              <Lock className="mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h2 className="font-bold">{t('escalation.tier_gate')}</h2>
                <p className="mt-1 text-sm">{t('escalation.tier_gate_desc', { tier })}</p>
              </div>
            </div>
          </div>
        )}

        {canUseEscalations && tier === 'growth' && (
          <div className="mb-6 rounded-xl border border-[#D3D1C7] bg-white p-4 text-sm text-[#1E3A5F]">
            {t('escalation.growth_usage')} <span className="font-bold">{t('escalation.active_rules', { count: activeRuleCount, limit: activeRuleLimit })}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 flex gap-2 rounded-xl border border-[#F1C0B8] bg-[#FDECEA] p-4 text-sm text-[#C0392B]">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-xl bg-white">
            <LoadingSpinner size="lg" />
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D3D1C7] bg-white p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EBF5FB] text-[#2E86AB]"><Zap size={22} /></div>
            <h2 className="text-lg font-bold text-[#1E3A5F]">{t('escalation.no_rules')}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#6B7B8D]">{t('escalation.no_rules_desc')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                disabled={saving || locked}
                onToggle={async (isActive) => {
                  try {
                    await updateRule(rule.id, { isActive });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed to update rule');
                  }
                }}
                onEdit={() => {
                  setEditingRule(rule);
                  setBuilderOpen(true);
                }}
                onDelete={() => void handleDelete(rule)}
              />
            ))}
          </div>
        )}
      </div>

      {builderOpen && (
        <RuleBuilder
          boards={boards}
          teamMembers={teamMembers}
          initialRule={editingRule}
          saving={saving}
          onClose={() => {
            setBuilderOpen(false);
            setEditingRule(null);
          }}
          onSave={handleSave}
        />
      )}
    </main>
  );
}

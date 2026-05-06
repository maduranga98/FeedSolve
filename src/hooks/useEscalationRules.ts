import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useSubscription } from './useSubscription';
import type { EscalationLog, EscalationRule, EscalationRuleInput } from '../types/escalationRule';

const GROWTH_ACTIVE_RULE_LIMIT = 5;
const ELIGIBLE_TIERS = new Set(['growth', 'business']);

function rulesCollection(companyId: string) {
  return collection(db, 'companies', companyId, 'escalationRules');
}

export function useEscalationRules() {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [rules, setRules] = useState<EscalationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = subscription?.tier ?? 'free';
  const canUseEscalations = ELIGIBLE_TIERS.has(tier);
  const activeRuleCount = useMemo(() => rules.filter((rule) => rule.isActive).length, [rules]);
  const activeRuleLimit = tier === 'growth' ? GROWTH_ACTIVE_RULE_LIMIT : Infinity;

  const loadRules = useCallback(async () => {
    if (!user) {
      setRules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rulesQuery = query(rulesCollection(user.companyId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(rulesQuery);
      setRules(snapshot.docs.map((ruleDoc) => ({ id: ruleDoc.id, ...ruleDoc.data() } as EscalationRule)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load escalation rules.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const assertCanActivate = useCallback((nextIsActive: boolean, currentRuleId?: string) => {
    if (!canUseEscalations) {
      throw new Error('Escalation rules are available on Growth plan.');
    }

    const currentRule = currentRuleId ? rules.find((rule) => rule.id === currentRuleId) : null;
    const isAlreadyActive = currentRule?.isActive ?? false;
    const nextActiveCount = activeRuleCount + (nextIsActive && !isAlreadyActive ? 1 : 0) - (!nextIsActive && isAlreadyActive ? 1 : 0);
    if (tier === 'growth' && nextActiveCount > GROWTH_ACTIVE_RULE_LIMIT) {
      throw new Error('Growth plan includes up to 5 active escalation rules.');
    }
  }, [activeRuleCount, canUseEscalations, rules, tier]);

  const createRule = useCallback(async (input: EscalationRuleInput) => {
    if (!user) throw new Error('You must be signed in to create rules.');
    assertCanActivate(input.isActive);

    setSaving(true);
    setError(null);
    try {
      const docRef = await addDoc(rulesCollection(user.companyId), {
        ...input,
        createdAt: Timestamp.now(),
        lastTriggeredAt: null,
        triggerCount: 0,
      });
      await loadRules();
      return docRef.id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create escalation rule.';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [assertCanActivate, loadRules, user]);

  const updateRule = useCallback(async (ruleId: string, input: Partial<EscalationRuleInput>) => {
    if (!user) throw new Error('You must be signed in to update rules.');
    if (input.isActive !== undefined) assertCanActivate(input.isActive, ruleId);

    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'companies', user.companyId, 'escalationRules', ruleId), input);
      await loadRules();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update escalation rule.';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [assertCanActivate, loadRules, user]);

  const deleteRule = useCallback(async (ruleId: string) => {
    if (!user) throw new Error('You must be signed in to delete rules.');

    setSaving(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'companies', user.companyId, 'escalationRules', ruleId));
      setRules((current) => current.filter((rule) => rule.id !== ruleId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete escalation rule.';
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }, [user]);

  const getEscalationLog = useCallback(async (submissionId: string) => {
    const logQuery = query(
      collection(db, 'submissions', submissionId, 'escalationLog'),
      orderBy('triggeredAt', 'desc')
    );
    const snapshot = await getDocs(logQuery);
    return snapshot.docs.map((logDoc) => ({ id: logDoc.id, ...logDoc.data() } as EscalationLog));
  }, []);

  return {
    rules,
    loading,
    saving,
    error,
    tier,
    canUseEscalations,
    activeRuleCount,
    activeRuleLimit,
    loadRules,
    createRule,
    updateRule,
    deleteRule,
    getEscalationLog,
  };
}

export async function hasActiveEscalationRules(companyId: string) {
  const activeQuery = query(rulesCollection(companyId), where('isActive', '==', true));
  const snapshot = await getDocs(activeQuery);
  return !snapshot.empty;
}

import { getCompany, updateDoc } from './firestore';
import { getLimit } from './tier-limits';
import { doc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export class UsageTracker {
  static async checkBoardLimit(companyId: string): Promise<{
    canCreate: boolean;
    current: number;
    limit: number;
  }> {
    const company = await getCompany(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const limit = getLimit(company.subscription.tier, 'boards');
    const current = company.usage.boardsCreated;

    return {
      canCreate: current < limit,
      current,
      limit,
    };
  }

  static async checkSubmissionLimit(companyId: string): Promise<{
    canSubmit: boolean;
    current: number;
    limit: number;
  }> {
    const company = await getCompany(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const limit = getLimit(company.subscription.tier, 'submissions');
    const current = company.usage.submissionsThisMonth;

    return {
      canSubmit: current < limit,
      current,
      limit,
    };
  }

  static async checkTeamMemberLimit(companyId: string): Promise<{
    canAdd: boolean;
    current: number;
    limit: number;
  }> {
    const company = await getCompany(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const limit = getLimit(company.subscription.tier, 'teamMembers');
    const current = company.usage.teamMembersAdded;

    return {
      canAdd: current < limit,
      current,
      limit,
    };
  }

  static async incrementBoardCount(companyId: string): Promise<void> {
    const companyRef = doc(db, 'companies', companyId);
    const company = await getCompany(companyId);
    if (!company) throw new Error('Company not found');

    await updateDoc(companyRef, {
      'usage.boardsCreated': company.usage.boardsCreated + 1,
      updatedAt: Timestamp.now(),
    });
  }

  static async incrementSubmissionCount(companyId: string): Promise<void> {
    const companyRef = doc(db, 'companies', companyId);
    const company = await getCompany(companyId);
    if (!company) throw new Error('Company not found');

    await updateDoc(companyRef, {
      'usage.submissionsThisMonth': company.usage.submissionsThisMonth + 1,
      updatedAt: Timestamp.now(),
    });
  }

  static async incrementTeamMemberCount(companyId: string): Promise<void> {
    const companyRef = doc(db, 'companies', companyId);
    const company = await getCompany(companyId);
    if (!company) throw new Error('Company not found');

    await updateDoc(companyRef, {
      'usage.teamMembersAdded': company.usage.teamMembersAdded + 1,
      updatedAt: Timestamp.now(),
    });
  }

  static async resetMonthlyUsage(companyId: string): Promise<void> {
    const companyRef = doc(db, 'companies', companyId);

    await updateDoc(companyRef, {
      'usage.submissionsThisMonth': 0,
      'usage.lastResetAt': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

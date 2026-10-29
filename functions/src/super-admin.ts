import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const ACTIVE_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const CONCURRENCY = 20;

type Engagement = "active" | "dormant" | "inactive" | "not_started";

interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: number | null;
  lastActive: number | null;
}

interface BoardRow {
  id: string;
  name: string;
  slug: string;
  submissionCount: number;
  createdAt: number | null;
}

interface CompanyRow {
  id: string;
  name: string;
  email: string;
  createdAt: number | null;
  tier: string;
  billing: string;
  subscriptionStatus: string;
  owner: { name: string; email: string; lastActive: number | null } | null;
  memberCount: number;
  boardCount: number;
  totalSubmissions: number;
  submissionsLast30Days: number;
  lastSubmissionAt: number | null;
  lastActivityAt: number | null;
  revenueCents: number;
  mrrCents: number;
  engagement: Engagement;
  members: MemberRow[];
  boards: BoardRow[];
}

const toMillis = (value: unknown): number | null => {
  if (value && typeof (value as admin.firestore.Timestamp).toMillis === "function") {
    return (value as admin.firestore.Timestamp).toMillis();
  }
  return null;
};

const maxOf = (...values: Array<number | null>): number | null => {
  const present = values.filter((v): v is number => v !== null);
  return present.length ? Math.max(...present) : null;
};

// Monthly-equivalent recurring revenue in cents, from list prices
// (mirrors src/lib/tier-limits.ts tierPricing).
const MRR_CENTS: Record<string, { monthly: number; annual: number }> = {
  starter: {monthly: 1900, annual: 18200},
  growth: {monthly: 4900, annual: 47000},
  business: {monthly: 7900, annual: 75800},
};

const computeMrrCents = (
  tier: string,
  billing: string,
  status: string,
): number => {
  const price = MRR_CENTS[tier];
  if (!price || status === "canceled" || status === "unpaid") return 0;
  return billing === "annual" ? Math.round(price.annual / 12) : price.monthly;
};

async function mapInBatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const chunk = items.slice(i, i + CONCURRENCY);
    results.push(...(await Promise.all(chunk.map(fn))));
  }
  return results;
}

/**
 * Platform-wide overview for the FeedSolve operator. Callable only by accounts
 * carrying the `superAdmin` custom claim (see scripts/set-super-admin.mjs).
 * Runs with the Admin SDK so it bypasses tenant-scoped Firestore rules.
 */
export const superAdminOverview = functions
  .runWith({timeoutSeconds: 300, memory: "1GB"})
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }
    if (context.auth.token.superAdmin !== true) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Super admin access required",
      );
    }

    const db = admin.firestore();
    const now = Date.now();
    const activeSince = admin.firestore.Timestamp.fromMillis(
      now - ACTIVE_WINDOW_DAYS * DAY_MS,
    );

    const [companiesSnap, usersSnap, boardsSnap, invoicesSnap] = await Promise.all([
      db.collection("companies").get(),
      db.collection("users").get(),
      db
        .collection("boards")
        .select("companyId", "name", "slug", "submissionCount", "createdAt")
        .get(),
      // Unfiltered collection-group read: avoids needing an extra index.
      db
        .collectionGroup("invoices")
        .select("companyId", "amount", "status", "currency")
        .get(),
    ]);

    const membersByCompany = new Map<string, MemberRow[]>();
    for (const doc of usersSnap.docs) {
      const d = doc.data();
      if (typeof d.companyId !== "string") continue;
      const row: MemberRow = {
        id: doc.id,
        name: d.name ?? "",
        email: d.email ?? "",
        role: d.role ?? "",
        createdAt: toMillis(d.createdAt),
        lastActive: toMillis(d.lastActive),
      };
      const list = membersByCompany.get(d.companyId) ?? [];
      list.push(row);
      membersByCompany.set(d.companyId, list);
    }

    const boardsByCompany = new Map<string, BoardRow[]>();
    for (const doc of boardsSnap.docs) {
      const d = doc.data();
      if (typeof d.companyId !== "string") continue;
      const row: BoardRow = {
        id: doc.id,
        name: d.name ?? "",
        slug: d.slug ?? "",
        submissionCount: d.submissionCount ?? 0,
        createdAt: toMillis(d.createdAt),
      };
      const list = boardsByCompany.get(d.companyId) ?? [];
      list.push(row);
      boardsByCompany.set(d.companyId, list);
    }

    // Invoice amounts are cents; revenue is tracked per currency-agnostic sum
    // because FeedSolve bills in a single currency.
    const revenueByCompany = new Map<string, number>();
    for (const doc of invoicesSnap.docs) {
      // Only subscription invoices: invoices/{companyId}/invoices/{id}
      if (doc.ref.parent.parent?.parent.id !== "invoices") continue;
      const d = doc.data();
      if (d.status !== "paid") continue;
      const companyId = (d.companyId as string) ?? doc.ref.parent.parent.id;
      revenueByCompany.set(
        companyId,
        (revenueByCompany.get(companyId) ?? 0) + (Number(d.amount) || 0),
      );
    }

    const companies = await mapInBatches(companiesSnap.docs, async (doc) => {
      const c = doc.data();
      const submissions = db
        .collection("submissions")
        .where("companyId", "==", doc.id);

      const [totalAgg, recentAgg, lastSnap] = await Promise.all([
        submissions.count().get(),
        submissions.where("createdAt", ">=", activeSince).count().get(),
        submissions.orderBy("createdAt", "desc").limit(1).get(),
      ]);

      const members = (membersByCompany.get(doc.id) ?? []).sort(
        (a, b) => (b.lastActive ?? 0) - (a.lastActive ?? 0),
      );
      const boards = (boardsByCompany.get(doc.id) ?? []).sort(
        (a, b) => b.submissionCount - a.submissionCount,
      );
      const ownerMember =
        members.find((m) => m.id === doc.id) ??
        members.find((m) => ["owner", "admin"].includes(m.role.toLowerCase())) ??
        members[0];

      const totalSubmissions = totalAgg.data().count;
      const submissionsLast30Days = recentAgg.data().count;
      const lastSubmissionAt = lastSnap.empty ?
        null :
        toMillis(lastSnap.docs[0].data().createdAt);
      const lastMemberActive = maxOf(...members.map((m) => m.lastActive));

      const sub = c.subscription ?? {};
      const tier: string = sub.tier ?? "free";
      const billing: string = sub.billing ?? "monthly";
      const subscriptionStatus: string = sub.status ?? "active";

      let engagement: Engagement;
      if (submissionsLast30Days > 0) engagement = "active";
      else if (totalSubmissions > 0) engagement = "dormant";
      else if (boards.length > 0) engagement = "inactive";
      else engagement = "not_started";

      const row: CompanyRow = {
        id: doc.id,
        name: c.name ?? "(unnamed)",
        email: c.email ?? "",
        createdAt: toMillis(c.createdAt),
        tier,
        billing,
        subscriptionStatus,
        owner: ownerMember ?
          {
            name: ownerMember.name,
            email: ownerMember.email,
            lastActive: ownerMember.lastActive,
          } :
          null,
        memberCount: members.length,
        boardCount: boards.length,
        totalSubmissions,
        submissionsLast30Days,
        lastSubmissionAt,
        lastActivityAt: maxOf(lastSubmissionAt, lastMemberActive),
        revenueCents: revenueByCompany.get(doc.id) ?? 0,
        mrrCents: computeMrrCents(tier, billing, subscriptionStatus),
        engagement,
        members,
        boards,
      };
      return row;
    });

    companies.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    const totals = companies.reduce(
      (acc, c) => {
        acc.companies += 1;
        acc.users += c.memberCount;
        acc.boards += c.boardCount;
        acc.submissions += c.totalSubmissions;
        acc.revenueCents += c.revenueCents;
        acc.mrrCents += c.mrrCents;
        if (c.tier !== "free") acc.paidCompanies += 1;
        acc.engagement[c.engagement] += 1;
        return acc;
      },
      {
        companies: 0,
        users: 0,
        boards: 0,
        submissions: 0,
        revenueCents: 0,
        mrrCents: 0,
        paidCompanies: 0,
        engagement: {active: 0, dormant: 0, inactive: 0, not_started: 0},
      },
    );

    return {generatedAt: now, activeWindowDays: ACTIVE_WINDOW_DAYS, totals, companies};
  });

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

    try {
      return await buildOverview();
    } catch (err) {
      if (err instanceof functions.https.HttpsError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      functions.logger.error("superAdminOverview failed", {error: message});
      throw new functions.https.HttpsError("internal", message);
    }
  });

async function buildOverview() {
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

    const partialErrors = new Set<string>();
    const companies = await mapInBatches(companiesSnap.docs, async (doc) => {
      const c = doc.data();
      const submissions = db
        .collection("submissions")
        .where("companyId", "==", doc.id);

      // A failing stat (e.g. an index not deployed yet) must not take down the
      // whole overview; log it and fall back to an empty value for this company.
      const safe = async <T>(label: string, run: () => Promise<T>, fallback: T) => {
        try {
          return await run();
        } catch (err) {
          functions.logger.error(`superAdminOverview: ${label} failed`, {
            companyId: doc.id,
            error: err instanceof Error ? err.message : String(err),
          });
          partialErrors.add(label);
          return fallback;
        }
      };

      const [totalCount, recentCount, lastSnap] = await Promise.all([
        safe("total submission count", async () =>
          (await submissions.count().get()).data().count, 0),
        safe("30-day submission count", async () =>
          (await submissions.where("createdAt", ">=", activeSince).count().get())
            .data().count, 0),
        safe("last submission lookup", () =>
          submissions.orderBy("createdAt", "desc").limit(1).get(), null),
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

      const totalSubmissions = totalCount;
      const submissionsLast30Days = recentCount;
      const lastSubmissionAt = !lastSnap || lastSnap.empty ?
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

    return {
      generatedAt: now,
      activeWindowDays: ACTIVE_WINDOW_DAYS,
      totals,
      companies,
      warnings: [...partialErrors],
    };
}

const INVITE_ROLES = ["admin", "manager", "viewer"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_MS = 7 * DAY_MS;

const slugify = (text: string): string =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

interface CreateBoardInput {
  companyId?: unknown;
  name?: unknown;
  description?: unknown;
  categories?: unknown;
  isAnonymousAllowed?: unknown;
  users?: unknown;
}

interface InviteResult {
  email: string;
  status: "invited" | "skipped";
  reason?: string;
}

/**
 * Super admin: create a board inside any company and invite users to that
 * company in one step. Plan limits are intentionally bypassed (operator
 * override). Invitations reuse the regular `teamInvitations` flow, so the
 * existing trigger emails each invitee an accept link.
 */
export const superAdminCreateBoard = functions
  .runWith({timeoutSeconds: 60})
  .https.onCall(async (data: CreateBoardInput, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Sign in required");
    }
    if (context.auth.token.superAdmin !== true) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Super admin access required",
      );
    }

    const companyId = typeof data?.companyId === "string" ? data.companyId : "";
    const name = typeof data?.name === "string" ? data.name.trim() : "";
    if (!companyId) {
      throw new functions.https.HttpsError("invalid-argument", "Select a company");
    }
    if (name.length < 2 || name.length > 100) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Board name must be 2-100 characters",
      );
    }
    const slug = slugify(name);
    if (!slug) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Board name must contain letters or numbers",
      );
    }

    const description = typeof data.description === "string" ?
      data.description.trim().slice(0, 500) :
      "";
    const categories = Array.isArray(data.categories) ?
      [...new Set(
        data.categories
          .filter((c): c is string => typeof c === "string")
          .map((c) => c.trim())
          .filter(Boolean),
      )].slice(0, 30) :
      [];

    const rawUsers = Array.isArray(data.users) ? data.users : [];
    if (rawUsers.length > 20) {
      throw new functions.https.HttpsError("invalid-argument", "Max 20 users per board");
    }
    const invitees = new Map<string, string>();
    for (const u of rawUsers) {
      const email = typeof u?.email === "string" ? u.email.trim().toLowerCase() : "";
      const role = typeof u?.role === "string" ? u.role : "manager";
      if (!EMAIL_RE.test(email)) {
        throw new functions.https.HttpsError("invalid-argument", `Invalid email: ${email || "(empty)"}`);
      }
      if (!(INVITE_ROLES as readonly string[]).includes(role)) {
        throw new functions.https.HttpsError("invalid-argument", `Invalid role: ${role}`);
      }
      invitees.set(email, role);
    }

    const db = admin.firestore();
    const companyRef = db.collection("companies").doc(companyId);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new functions.https.HttpsError("not-found", "Company not found");
    }

    const conflict = await db
      .collection("boards")
      .where("companyId", "==", companyId)
      .where("name", "==", name)
      .limit(1)
      .get();
    if (!conflict.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "This company already has a board with that name",
      );
    }

    // Slugs are global public URLs (/submit/:slug); never collide with another company.
    const slugTaken = await db.collection("boards").where("slug", "==", slug).limit(1).get();
    const finalSlug = slugTaken.empty ? slug : `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const now = admin.firestore.Timestamp.now();
    const boardRef = db.collection("boards").doc();
    const appBase = process.env.APP_URL || process.env.VITE_APP_URL || "https://app.feedsolve.com";

    const batch = db.batch();
    batch.set(boardRef, {
      companyId,
      name,
      description,
      slug: finalSlug,
      categories,
      categoryTranslationsEnabled: false,
      categoryTranslations: {},
      locations: [],
      isAnonymousAllowed: data.isAnonymousAllowed !== false,
      showSatisfactionRating: false,
      satisfactionRequired: false,
      supportedLanguages: ["en"],
      qrCodeUrl: `${appBase}/submit/${finalSlug}`,
      createdAt: now,
      updatedAt: now,
      submissionCount: 0,
      recurringEnabled: false,
      recurringFrequency: null,
      recurringCustomDays: null,
      recurringStartDate: null,
      currentCycleId: null,
      nextCycleDate: null,
      createdBySuperAdmin: context.auth.uid,
    });
    batch.update(companyRef, {
      boardCount: admin.firestore.FieldValue.increment(1),
      "usage.boardsCreated": admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });
    await batch.commit();

    // Users: skip existing members and pending invites; one account = one company.
    const invites: InviteResult[] = [];
    for (const [email, role] of invitees) {
      const [existingUser, pending] = await Promise.all([
        db.collection("users").where("email", "==", email).limit(1).get(),
        db.collection("teamInvitations")
          .where("companyId", "==", companyId)
          .where("email", "==", email)
          .where("status", "==", "pending")
          .limit(1)
          .get(),
      ]);
      if (!existingUser.empty) {
        const sameCompany = existingUser.docs[0].data().companyId === companyId;
        invites.push({
          email,
          status: "skipped",
          reason: sameCompany ? "Already a member" : "Belongs to another company",
        });
        continue;
      }
      if (!pending.empty) {
        invites.push({email, status: "skipped", reason: "Invite already pending"});
        continue;
      }
      await db.collection("teamInvitations").add({
        companyId,
        email,
        role,
        invitedBy: context.auth.uid,
        inviteCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
        status: "pending",
        createdAt: now,
        expiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + INVITE_TTL_MS),
      });
      invites.push({email, status: "invited"});
    }

    functions.logger.info("superAdminCreateBoard", {
      boardId: boardRef.id,
      companyId,
      by: context.auth.uid,
    });
    return {boardId: boardRef.id, slug: finalSlug, name, invites};
  });

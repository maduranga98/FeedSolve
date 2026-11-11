import type {
  Board,
  FeedbackResponse,
  Submission,
  SubmissionCustomFieldValue,
  User,
} from '../types';
import { getBoard, getBoardFeedbackResponses, getCompanyMembers, getSubmissionTeamFields } from './firestore';
import { formatFeedbackValue, getFeedbackConfig } from './feedback';
import { getSubmissionFieldDisplays } from './submission-fields';
import { downloadTextFile } from './download';
import { toCSVCell } from './exportCSV';

/** Everything beyond the submission document itself that a full export includes. */
export interface ExportContext {
  boards: Map<string, Board>;
  /** Team-only answers by submission id (absent when none saved or not readable). */
  teamAnswers: Map<string, SubmissionCustomFieldValue[]>;
  /** Submitter feedback by tracking code. */
  feedback: Map<string, FeedbackResponse>;
  /** Team member names by user id. */
  members: Map<string, string>;
}

interface Column {
  key: string;
  section: string;
  label: string;
}

type Cells = Map<string, string>;

const ISO = (ts?: { toDate(): Date } | null) => (ts ? ts.toDate().toISOString() : '');

async function inChunks<T>(items: T[], size: number, task: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(task));
  }
}

/** Loads the boards, team-only answers, feedback and member names the export needs. */
export async function loadExportContext(
  submissions: Submission[],
  options: { companyId?: string; knownBoards?: Board[] } = {}
): Promise<ExportContext> {
  const boards = new Map<string, Board>((options.knownBoards ?? []).map((b) => [b.id, b]));
  const boardIds = [...new Set(submissions.map((s) => s.boardId))].filter((id) => !boards.has(id));

  const ctx: ExportContext = { boards, teamAnswers: new Map(), feedback: new Map(), members: new Map() };

  await Promise.all([
    inChunks(boardIds, 10, async (id) => {
      try {
        const board = await getBoard(id);
        if (board) boards.set(id, board);
      } catch (error) {
        console.error('Export: failed to load board', id, error);
      }
    }),
    options.companyId
      ? getCompanyMembers(options.companyId)
          .then((users: User[]) => users.forEach((u) => ctx.members.set(u.id, u.name)))
          .catch((error) => console.error('Export: failed to load members', error))
      : Promise.resolve(),
  ]);

  const teamBoards = new Set(
    [...boards.values()].filter((b) => b.submissionConfig?.useCustomFields).map((b) => b.id)
  );
  const feedbackBoards = [...boards.values()].filter((b) => getFeedbackConfig(b).enabled).map((b) => b.id);

  await Promise.all([
    inChunks(
      submissions.filter((s) => teamBoards.has(s.boardId)),
      10,
      async (s) => {
        try {
          const data = await getSubmissionTeamFields(s.id);
          if (data?.customFields) ctx.teamAnswers.set(s.id, data.customFields);
        } catch {
          // Not readable for this user: leave the team-only columns blank.
        }
      }
    ),
    inChunks(feedbackBoards, 5, async (boardId) => {
      try {
        const responses = await getBoardFeedbackResponses(boardId, 1000);
        responses.forEach((r) => ctx.feedback.set(r.trackingCode, r));
      } catch (error) {
        console.error('Export: failed to load feedback', boardId, error);
      }
    }),
  ]);

  return ctx;
}

function describeSubmission(
  sub: Submission,
  ctx: ExportContext,
  columns: Column[],
  seen: Set<string>
): Cells {
  const cells: Cells = new Map();
  const put = (section: string, label: string, value: string | undefined | null, uniqueKey?: string) => {
    const key = uniqueKey ?? `${section}|${label}`;
    if (!seen.has(key)) {
      seen.add(key);
      columns.push({ key, section, label });
    }
    cells.set(key, value ?? '');
  };

  const board = ctx.boards.get(sub.boardId);
  const created = sub.createdAt?.toDate();
  const resolved = sub.resolvedAt?.toDate();

  put('Submission', 'Tracking Code', sub.trackingCode);
  put('Submission', 'Board', board?.name ?? '');
  put('Submission', 'Subject', sub.subject);
  put('Submission', 'Description', sub.description);
  put('Submission', 'Category', sub.category);
  put('Submission', 'Status', sub.status);
  put('Submission', 'Priority', sub.priority);
  put('Submission', 'Assigned To', sub.assignedTo ? (ctx.members.get(sub.assignedTo) ?? sub.assignedTo) : 'Unassigned');
  put('Submission', 'Location', sub.location);
  put('Submission', 'Created At', ISO(sub.createdAt));
  put('Submission', 'Updated At', ISO(sub.updatedAt));
  put('Submission', 'Resolved At', ISO(sub.resolvedAt));
  put(
    'Submission',
    'Resolution Time (days)',
    created && resolved ? String(Math.floor((resolved.getTime() - created.getTime()) / 86_400_000)) : ''
  );
  put('Submission', 'Attachments', (sub.attachments ?? []).map((a) => a.filename).filter(Boolean).join('; '));

  put('Submitter', 'Anonymous', sub.isAnonymous ? 'Yes' : 'No');
  put('Submitter', 'Name', sub.isAnonymous ? '' : sub.submitterName);
  put('Submitter', 'Email', sub.isAnonymous ? '' : sub.submitterEmail);
  put('Submitter', 'Mobile', sub.isAnonymous ? '' : sub.submitterMobile);

  const assigneeName = sub.assignedTo ? ctx.members.get(sub.assignedTo) ?? null : null;
  const displays = getSubmissionFieldDisplays(board, sub, {
    assigneeName,
    teamFields: ctx.teamAnswers.get(sub.id),
  });
  for (const item of displays) {
    if (item.audience === 'internal') put('Team-only fields', item.label, item.value);
    else put('Form responses', item.label, item.value);
  }

  put('Public reply', 'Reply', sub.publicReply);
  put('Public reply', 'Replied At', ISO(sub.publicReplyAt));

  const response = ctx.feedback.get(sub.trackingCode);
  if (board && getFeedbackConfig(board).enabled) {
    const config = getFeedbackConfig(board);
    const byId = new Map(response?.responses.map((r) => [r.fieldId, r.value]));
    for (const field of config.fields) {
      put('Submitter feedback', field.label, formatFeedbackValue(field, byId.get(field.id)));
    }
    put('Submitter feedback', 'Feedback Name', response?.contact?.name);
    put('Submitter feedback', 'Feedback Email', response?.contact?.email);
    put('Submitter feedback', 'Feedback Submitted At', ISO(response?.submittedAt));
  }

  return cells;
}

function buildTable(submissions: Submission[], ctx: ExportContext) {
  const columns: Column[] = [];
  const seen = new Set<string>();
  const rows = submissions.map((sub) => describeSubmission(sub, ctx, columns, seen));
  return { columns, rows };
}

function download(csv: string, filename: string) {
  // BOM keeps non-ASCII text intact in Excel.
  downloadTextFile(`﻿${csv}`, filename, 'text/csv;charset=utf-8;');
}

/** One row per submission, one column per field: every form, team-only and feedback answer. */
export function downloadFullSubmissionsCSV(submissions: Submission[], ctx: ExportContext) {
  const { columns, rows } = buildTable(submissions, ctx);
  const csv = [
    columns.map((c) => (c.section === 'Submission' || c.section === 'Submitter' ? c.label : `${c.section}: ${c.label}`)),
    ...rows.map((cells) => columns.map((c) => cells.get(c.key) ?? '')),
  ]
    .map((row) => row.map(toCSVCell).join(','))
    .join('\n');
  download(csv, `submissions-full-${new Date().toISOString().split('T')[0]}.csv`);
}

/** Readable Section / Field / Value layout for a single submission. */
export function downloadSingleSubmissionCSV(submission: Submission, ctx: ExportContext) {
  const { columns, rows } = buildTable([submission], ctx);
  const cells = rows[0];
  const csv = [
    ['Section', 'Field', 'Value'],
    ...columns.map((c) => [c.section, c.label, cells.get(c.key) ?? '']),
  ]
    .map((row) => row.map(toCSVCell).join(','))
    .join('\n');
  download(csv, `submission-${submission.trackingCode.replace(/^#/, '')}.csv`);
}

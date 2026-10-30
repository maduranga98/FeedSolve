import type { FeedbackField, FeedbackResponse, Submission } from '../types';
import { formatFeedbackValue, sortFeedbackFields } from './feedback';
import { downloadTextFile } from './download';

export function exportSubmissionsToCSV(submissions: Submission[], filename = 'submissions.csv') {
  const headers = [
    'ID',
    'Tracking Code',
    'Subject',
    'Description',
    'Category',
    'Status',
    'Priority',
    'Assigned To',
    'Created At',
    'Updated At',
  ];

  const rows = submissions.map((sub) => [
    sub.id,
    sub.trackingCode,
    `"${(sub.subject || '').replace(/"/g, '""')}"`,
    `"${(sub.description || '').replace(/"/g, '""')}"`,
    sub.category || '',
    sub.status || '',
    sub.priority || '',
    sub.assignedTo || '',
    sub.createdAt.toDate().toISOString(),
    sub.updatedAt.toDate().toISOString(),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  downloadTextFile(csv, filename, 'text/csv;charset=utf-8;');
}

// Quotes every cell and neutralises spreadsheet formulas: submitters control the
// free-text values, and Excel/Sheets evaluate cells that start with = + - @.
function toCSVCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportFeedbackResponsesToCSV(
  responses: FeedbackResponse[],
  fields: FeedbackField[],
  filename = 'feedback-responses.csv'
) {
  const orderedFields = sortFeedbackFields(fields);
  const headers = ['Tracking Code', 'Submitted At', ...orderedFields.map((field) => field.label)];

  const rows = responses.map((response) => {
    const valuesByFieldId = new Map(response.responses.map((answer) => [answer.fieldId, answer.value]));
    return [
      response.trackingCode,
      response.submittedAt?.toDate().toISOString() ?? '',
      ...orderedFields.map((field) => formatFeedbackValue(field, valuesByFieldId.get(field.id))),
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map(toCSVCell).join(',')).join('\n');

  // BOM keeps non-ASCII text intact when opened in Excel.
  downloadTextFile(`\uFEFF${csv}`, filename, 'text/csv;charset=utf-8;');
}

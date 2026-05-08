import type { Submission } from '../types';
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

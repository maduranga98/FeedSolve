import type { Submission } from '../types';

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

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

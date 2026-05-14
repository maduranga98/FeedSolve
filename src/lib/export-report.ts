import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { AuditLog, Submission } from '../types';
import { downloadBlob, downloadTextFile } from './download';
import type { AnalyticsMetrics } from './analytics';
import { formatDateRange, type DateRange } from './date-ranges';

type AutoTableDocument = jsPDF & { lastAutoTable?: { finalY: number } };


export interface ExportReportOptions {
  includeMetrics: boolean;
  includeStatus: boolean;
  includePriority: boolean;
  includeCategory: boolean;
  includeTeamPerformance: boolean;
  includeTrends: boolean;
}

const DEFAULT_REPORT_OPTIONS: ExportReportOptions = {
  includeMetrics: true,
  includeStatus: true,
  includePriority: true,
  includeCategory: true,
  includeTeamPerformance: true,
  includeTrends: true,
};

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatAuditDetailValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(formatAuditDetailValue).filter(Boolean).join(', ');
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') {
    if ('toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
      return ((value as { toDate: () => Date }).toDate()).toLocaleString();
    }
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nestedValue]) => `${humanizeKey(key)}: ${formatAuditDetailValue(nestedValue)}`)
      .join('; ');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

export function formatAuditDetails(details: AuditLog['details']): string {
  if (!details || Object.keys(details).length === 0) return '—';
  return Object.entries(details)
    .map(([key, value]) => `${humanizeKey(key)}: ${formatAuditDetailValue(value) || '—'}`)
    .join('; ');
}

function getLastTableY(doc: jsPDF, fallback: number): number {
  return (doc as AutoTableDocument).lastAutoTable?.finalY ?? fallback;
}


export async function exportPDFReport(
  metrics: AnalyticsMetrics,
  dateRange: DateRange,
  companyName: string,
  reportOptions: ExportReportOptions = DEFAULT_REPORT_OPTIONS
): Promise<Blob> {
  const options = { ...DEFAULT_REPORT_OPTIONS, ...reportOptions };
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const ensureSpace = () => {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Analytics Report', margin, yPosition);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPosition += 10;
  doc.text(`Company: ${companyName}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Period: ${formatDateRange(dateRange)}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);

  yPosition += 12;
  let sectionAdded = false;

  if (options.includeMetrics) {
    ensureSpace();
    addSectionTitle(doc, 'Key Metrics', margin, yPosition);
    yPosition += 10;

    const metricsData = [
      ['Metric', 'Value'],
      ['Total Submissions', metrics.totalSubmissions.toString()],
      ['Resolved Submissions', metrics.resolvedSubmissions.toString()],
      ['Resolution Rate', `${metrics.resolutionRate.toFixed(1)}%`],
      ['Avg Resolution Time', `${metrics.averageResolutionTime.toFixed(1)} days`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: metricsData.slice(0, 1),
      body: metricsData.slice(1),
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    yPosition = getLastTableY(doc, yPosition) + 15;
    sectionAdded = true;
  }

  if (options.includeStatus) {
    ensureSpace();
    addSectionTitle(doc, 'Submissions by Status', margin, yPosition);
    yPosition += 10;

    const statusData = [
      ['Status', 'Count'],
      ...Object.entries(metrics.submissionsByStatus).map(([status, count]) => [
        status.replace(/_/g, ' '),
        count.toString(),
      ]),
    ];

    autoTable(doc, {
      startY: yPosition,
      head: statusData.slice(0, 1),
      body: statusData.slice(1),
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    });

    yPosition = getLastTableY(doc, yPosition) + 15;
    sectionAdded = true;
  }

  if (options.includePriority) {
    ensureSpace();
    addSectionTitle(doc, 'Submissions by Priority', margin, yPosition);
    yPosition += 10;

    const priorityData = [
      ['Priority', 'Count'],
      ...Object.entries(metrics.submissionsByPriority).map(([priority, count]) => [
        priority,
        count.toString(),
      ]),
    ];

    autoTable(doc, {
      startY: yPosition,
      head: priorityData.slice(0, 1),
      body: priorityData.slice(1),
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    });

    yPosition = getLastTableY(doc, yPosition) + 15;
    sectionAdded = true;
  }

  if (options.includeCategory && Object.keys(metrics.submissionsByCategory).length > 0) {
    ensureSpace();
    addSectionTitle(doc, 'Submissions by Category', margin, yPosition);
    yPosition += 10;

    const categoryData = [
      ['Category', 'Count'],
      ...Object.entries(metrics.submissionsByCategory).map(([category, count]) => [
        category,
        count.toString(),
      ]),
    ];

    autoTable(doc, {
      startY: yPosition,
      head: categoryData.slice(0, 1),
      body: categoryData.slice(1),
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    });

    yPosition = getLastTableY(doc, yPosition) + 15;
    sectionAdded = true;
  }

  if (options.includeTrends && metrics.trendData.length > 0) {
    ensureSpace();
    addSectionTitle(doc, 'Trend Analysis', margin, yPosition);
    yPosition += 10;

    const trendData = [
      ['Date', 'Submissions', 'Resolved'],
      ...metrics.trendData.map((point) => [
        point.date,
        point.count.toString(),
        point.resolved.toString(),
      ]),
    ];

    autoTable(doc, {
      startY: yPosition,
      head: trendData.slice(0, 1),
      body: trendData.slice(1),
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    });

    yPosition = getLastTableY(doc, yPosition) + 15;
    sectionAdded = true;
  }

  if (options.includeTeamPerformance && metrics.teamPerformance.length > 0) {
    ensureSpace();
    addSectionTitle(doc, 'Team Performance', margin, yPosition);
    yPosition += 10;

    const teamData = [
      ['Team Member', 'Assigned', 'Resolved', 'Resolution Rate', 'Avg Time (days)'],
      ...metrics.teamPerformance.map((member) => [
        member.userName || member.userEmail,
        member.assignedCount.toString(),
        member.resolvedCount.toString(),
        `${member.resolutionRate.toFixed(1)}%`,
        member.averageResolutionTime.toFixed(1),
      ]),
    ];

    autoTable(doc, {
      startY: yPosition,
      head: teamData.slice(0, 1),
      body: teamData.slice(1),
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
      },
    });

    yPosition = getLastTableY(doc, yPosition) + 15;
    sectionAdded = true;
  }

  if (!sectionAdded) {
    doc.text('No report sections were selected.', margin, yPosition);
  }

  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

export async function downloadPDFReport(
  metrics: AnalyticsMetrics,
  dateRange: DateRange,
  companyName: string,
  options?: ExportReportOptions,
  filenamePrefix = 'analytics-report'
): Promise<void> {
  const blob = await exportPDFReport(metrics, dateRange, companyName, options);
  const now = new Date();
  const datePart = now.toISOString().split('T')[0];
  const timePart = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  downloadBlob(blob, `${filenamePrefix}-${datePart}-${timePart}.pdf`);
}

export function exportCSVSubmissions(submissions: Submission[]): string {
  const headers = [
    'Tracking Code',
    'Subject',
    'Category',
    'Status',
    'Priority',
    'Assigned To',
    'Created At',
    'Resolved At',
    'Resolution Time (days)',
  ];

  const rows = submissions.map((sub) => {
    const createdDate = sub.createdAt instanceof Date ? sub.createdAt : sub.createdAt?.toDate();
    const resolvedDate = sub.resolvedAt instanceof Date ? sub.resolvedAt : sub.resolvedAt?.toDate();

    let resolutionTime = '';
    if (createdDate && resolvedDate) {
      resolutionTime = Math.floor(
        (resolvedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      ).toString();
    }

    return [
      sub.trackingCode,
      `"${sub.subject.replace(/"/g, '""')}"`,
      sub.category,
      sub.status,
      sub.priority,
      sub.assignedTo || 'Unassigned',
      createdDate?.toISOString() || '',
      resolvedDate?.toISOString() || '',
      resolutionTime,
    ];
  });

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csv;
}

export function downloadCSV(submissions: Submission[]): void {
  const csv = exportCSVSubmissions(submissions);
  downloadTextFile(csv, `submissions-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

function formatAuditDate(value: AuditLog['createdAt']): string {
  if (!value) return '—';
  if (value instanceof Date) return value.toLocaleString();
  return value.toDate().toLocaleString();
}

export function exportAuditLogsPDF(logs: AuditLog[], companyName: string): Blob {
  const doc = new jsPDF({ orientation: 'landscape' });
  const margin = 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Audit Logs Report', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Company: ${companyName}`, margin, 26);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 32);
  doc.text(`Total Records: ${logs.length}`, margin, 38);

  autoTable(doc, {
    startY: 44,
    head: [['Timestamp', 'User', 'Action', 'Resource Type', 'Resource', 'Details']],
    body: logs.map((log) => [
      formatAuditDate(log.createdAt),
      `${log.userName || 'Unknown'}\n${log.userEmail || ''}`,
      log.action,
      log.resourceType.replace(/_/g, ' '),
      log.resourceName ?? log.resourceId ?? '',
      formatAuditDetails(log.details),
    ]),
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [46, 134, 171], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 34 },
      1: { cellWidth: 48 },
      2: { cellWidth: 42 },
      3: { cellWidth: 30 },
      4: { cellWidth: 46 },
      5: { cellWidth: 68 },
    },
  });

  return doc.output('blob');
}

export function downloadAuditLogsPDF(logs: AuditLog[], companyName: string): void {
  const blob = exportAuditLogsPDF(logs, companyName);
  downloadBlob(blob, `audit-logs-${new Date().toISOString().split('T')[0]}.pdf`);
}

function addSectionTitle(doc: jsPDF, title: string, x: number, y: number): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
}

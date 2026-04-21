import jsPDF from 'jspdf';
import { Submission } from '../types';
import { AnalyticsMetrics } from './analytics';
import { DateRange, formatDateRange } from './date-ranges';

export async function exportPDFReport(
  metrics: AnalyticsMetrics,
  dateRange: DateRange,
  companyName: string
): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

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
  addSectionTitle(doc, 'Key Metrics', margin, yPosition);
  yPosition += 10;

  const metricsData = [
    ['Metric', 'Value'],
    ['Total Submissions', metrics.totalSubmissions.toString()],
    ['Resolved Submissions', metrics.resolvedSubmissions.toString()],
    ['Resolution Rate', `${metrics.resolutionRate.toFixed(1)}%`],
    ['Avg Resolution Time', `${metrics.averageResolutionTime.toFixed(1)} days`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: metricsData.slice(0, 1),
    body: metricsData.slice(1),
    margin: { left: margin, right: margin },
    width: contentWidth,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Status breakdown
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 20;
  }

  addSectionTitle(doc, 'Submissions by Status', margin, yPosition);
  yPosition += 10;

  const statusData = [
    ['Status', 'Count'],
    ...Object.entries(metrics.submissionsByStatus).map(([status, count]) => [
      status.replace(/_/g, ' '),
      count.toString(),
    ]),
  ];

  doc.autoTable({
    startY: yPosition,
    head: statusData.slice(0, 1),
    body: statusData.slice(1),
    margin: { left: margin, right: margin },
    width: contentWidth,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: 255 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Priority breakdown
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 20;
  }

  addSectionTitle(doc, 'Submissions by Priority', margin, yPosition);
  yPosition += 10;

  const priorityData = [
    ['Priority', 'Count'],
    ...Object.entries(metrics.submissionsByPriority).map(([priority, count]) => [
      priority,
      count.toString(),
    ]),
  ];

  doc.autoTable({
    startY: yPosition,
    head: priorityData.slice(0, 1),
    body: priorityData.slice(1),
    margin: { left: margin, right: margin },
    width: contentWidth,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: 255 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Category breakdown
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = 20;
  }

  if (Object.keys(metrics.submissionsByCategory).length > 0) {
    addSectionTitle(doc, 'Submissions by Category', margin, yPosition);
    yPosition += 10;

    const categoryData = [
      ['Category', 'Count'],
      ...Object.entries(metrics.submissionsByCategory).map(([category, count]) => [
        category,
        count.toString(),
      ]),
    ];

    doc.autoTable({
      startY: yPosition,
      head: categoryData.slice(0, 1),
      body: categoryData.slice(1),
      margin: { left: margin, right: margin },
      width: contentWidth,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Team performance
  if (metrics.teamPerformance.length > 0) {
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

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

    doc.autoTable({
      startY: yPosition,
      head: teamData.slice(0, 1),
      body: teamData.slice(1),
      margin: { left: margin, right: margin },
      width: contentWidth,
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
  }

  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

export async function downloadPDFReport(
  metrics: AnalyticsMetrics,
  dateRange: DateRange,
  companyName: string
): Promise<void> {
  const blob = await exportPDFReport(metrics, dateRange, companyName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `submissions-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function addSectionTitle(doc: jsPDF, title: string, x: number, y: number): void {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
}

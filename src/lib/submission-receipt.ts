import jsPDF from 'jspdf';
import QRCodeStyling from 'qr-code-styling';
import { downloadBlob } from './download';

export interface SubmissionReceiptInput {
  trackingCode: string;
  trackingUrl: string;
  boardName?: string;
  submittedAt?: Date;
  companyName?: string;
  companyLogoUrl?: string | null;
  companyPrimaryColor?: string | null;
  companySecondaryColor?: string | null;
  companyContactEmail?: string | null;
  companyContactNumber?: string | null;
  companyAddress?: string | null;
}

const FEEDSOLVE_PRIMARY = '#2E86AB';
const FEEDSOLVE_SECONDARY = '#1E3A5F';

async function generateQRDataUrl(url: string, color: string): Promise<string> {
  const qr = new QRCodeStyling({
    width: 320,
    height: 320,
    type: 'canvas',
    data: url,
    margin: 8,
    dotsOptions: { color, type: 'rounded' },
    backgroundOptions: { color: '#FFFFFF' },
    cornersSquareOptions: { color, type: 'extra-rounded' },
    cornersDotOptions: { color, type: 'dot' },
    qrOptions: { errorCorrectionLevel: 'M' },
  });
  const blob = await qr.getRawData('png');
  if (!blob) throw new Error('Failed to generate QR code');
  const arrayBuffer = await (blob as Blob).arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return `data:image/png;base64,${btoa(binary)}`;
}

async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function hexToRgb(hex: string | null | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback;
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function generateSubmissionReceiptPdf(input: SubmissionReceiptInput): Promise<Blob> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primary = hexToRgb(input.companyPrimaryColor, hexToRgb(FEEDSOLVE_PRIMARY, [46, 134, 171]));
  const secondary = hexToRgb(input.companySecondaryColor, hexToRgb(FEEDSOLVE_SECONDARY, [30, 58, 95]));

  // ─── Header band ───────────────────────────────────────────────
  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.rect(0, 0, pageWidth, 110, 'F');
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.rect(0, 95, pageWidth, 15, 'F');

  // Company logo or initial
  const margin = 40;
  let titleX = margin;
  if (input.companyLogoUrl) {
    const logoData = await loadImageDataUrl(input.companyLogoUrl);
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', margin, 28, 54, 54);
        titleX = margin + 70;
      } catch {
        // ignore image errors
      }
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(input.companyName || 'Submission Receipt', titleX, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('Submission Receipt', titleX, 75);

  // ─── Body ──────────────────────────────────────────────────────
  let y = 150;

  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Thank you for your submission', margin, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  const intro = input.boardName
    ? `Your feedback for "${input.boardName}" has been received. Use the details below to check progress anytime.`
    : 'Your feedback has been received. Use the details below to check progress anytime.';
  const introLines = doc.splitTextToSize(intro, pageWidth - margin * 2);
  doc.text(introLines, margin, y);
  y += introLines.length * 14 + 18;

  // Tracking code card
  doc.setDrawColor(primary[0], primary[1], primary[2]);
  doc.setFillColor(245, 250, 253);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 90, 10, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('TRACKING CODE / PASSCODE', margin + 18, y + 22);

  doc.setFont('courier', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.text(input.trackingCode, margin + 18, y + 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Keep this code safe — you will need it to view your submission status.', margin + 18, y + 78);

  y += 110;

  // QR + tracking URL
  const qrDataUrl = await generateQRDataUrl(input.trackingUrl, '#' + primary.map((c) => c.toString(16).padStart(2, '0')).join(''));
  const qrSize = 130;
  try {
    doc.addImage(qrDataUrl, 'PNG', margin, y, qrSize, qrSize);
  } catch {
    // ignore
  }

  const textX = margin + qrSize + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(secondary[0], secondary[1], secondary[2]);
  doc.text('How to check your progress', textX, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  const steps = [
    '1. Scan the QR code, or open the link below in your browser.',
    '2. Enter your tracking code / passcode when prompted.',
    '3. View status updates and replies from the team.',
  ];
  let stepY = y + 36;
  for (const step of steps) {
    const lines = doc.splitTextToSize(step, pageWidth - textX - margin);
    doc.text(lines, textX, stepY);
    stepY += lines.length * 13 + 4;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('Tracking link:', textX, stepY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  const urlLines = doc.splitTextToSize(input.trackingUrl, pageWidth - textX - margin);
  doc.text(urlLines, textX, stepY + 18);

  y += qrSize + 24;

  // Submission meta
  if (input.submittedAt) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text(`Submitted: ${input.submittedAt.toLocaleString()}`, margin, y);
    y += 16;
  }

  // Company contact strip
  const contactParts = [input.companyAddress, input.companyContactNumber, input.companyContactEmail]
    .filter((v): v is string => Boolean(v && v.trim().length));
  if (contactParts.length) {
    doc.setDrawColor(220, 228, 236);
    doc.line(margin, y + 6, pageWidth - margin, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 120, 130);
    doc.text(contactParts.join('  ·  '), margin, y + 22);
  }

  // ─── FeedSolve footer (mandatory branding) ────────────────────
  const footerHeight = 56;
  doc.setFillColor(secondary[0], secondary[1], secondary[2]);
  doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('FeedSolve', margin, pageHeight - footerHeight + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 230, 240);
  doc.text('Collect feedback. Resolve it fast.', margin, pageHeight - footerHeight + 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 215, 230);
  const rightText = 'feedsolve.com';
  const rightWidth = doc.getTextWidth(rightText);
  doc.text(rightText, pageWidth - margin - rightWidth, pageHeight - footerHeight + 32);

  return doc.output('blob');
}

export async function downloadSubmissionReceiptPdf(input: SubmissionReceiptInput): Promise<void> {
  const blob = await generateSubmissionReceiptPdf(input);
  const safeCode = input.trackingCode.replace(/[^a-zA-Z0-9_-]/g, '');
  downloadBlob(blob, `feedsolve-receipt-${safeCode || 'submission'}.pdf`);
}

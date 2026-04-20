export function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '#FSV-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateBoardSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    received: { bg: 'bg-[#EFF3F6]', text: 'text-[#6B7B8D]' },
    in_review: { bg: 'bg-[#EBF5FB]', text: 'text-[#185FA5]' },
    in_progress: { bg: 'bg-[#FEF5E7]', text: 'text-[#854F0B]' },
    resolved: { bg: 'bg-[#EBF9F1]', text: 'text-[#0F6E56]' },
    closed: { bg: 'bg-[#F1EFE8]', text: 'text-[#5F5E5A]' },
  };
  return colors[status] || colors.received;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    received: 'Received',
    in_review: 'In Review',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status] || status;
}

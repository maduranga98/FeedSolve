/**
 * Browser download helper that works consistently across Chromium, Firefox,
 * and Safari by attaching the generated anchor to the DOM before clicking it.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadTextFile(content: string, filename: string, type: string): void {
  downloadBlob(new Blob([content], { type }), filename);
}

export function downloadUrl(url: string, filename?: string): void {
  const link = document.createElement('a');

  link.href = url;
  if (filename) link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  downloadUrl(dataUrl, filename);
}

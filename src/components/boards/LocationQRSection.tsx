import { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, FileArchive, MapPin, QrCode } from 'lucide-react';
import type { Board } from '../../types';
import { buildLocationUrl, downloadCanvasPng, exportLocationQrZip } from '../../utils/qrZipExport';

interface LocationQRSectionProps {
  board: Board;
  feedbackUrl: string;
}

function filenameSafe(value: string): string {
  return value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'location';
}

export function LocationQRSection({ board, feedbackUrl }: LocationQRSectionProps) {
  const locations = board.locations || [];
  const [selectedLocation, setSelectedLocation] = useState(locations[0] || '');
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenRefs = useRef<Record<string, HTMLCanvasElement | null>>({});

  const activeLocation = locations.includes(selectedLocation) ? selectedLocation : locations[0] || '';

  const selectedUrl = useMemo(
    () => (activeLocation ? buildLocationUrl(feedbackUrl, activeLocation) : feedbackUrl),
    [feedbackUrl, activeLocation]
  );

  const downloadSelected = async () => {
    if (!previewRef.current || !activeLocation) return;
    await downloadCanvasPng(
      previewRef.current,
      `${filenameSafe(board.name)}-${filenameSafe(activeLocation)}.png`
    );
  };

  const downloadAll = async () => {
    if (locations.length === 0) return;
    setProgress(locations.length > 10 ? { completed: 0, total: locations.length } : null);
    try {
      await exportLocationQrZip({
        boardName: board.name,
        locations,
        renderCanvas: async (location) => {
          await new Promise((resolve) => window.requestAnimationFrame(resolve));
          const canvas = hiddenRefs.current[location];
          if (!canvas) throw new Error(`Missing QR canvas for ${location}`);
          return canvas;
        },
        onProgress: (completed, total) => setProgress(total > 10 ? { completed, total } : null),
      });
    } finally {
      setProgress(null);
    }
  };

  if (locations.length === 0) {
    return (
      <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-bd6cabf)] p-5">
        <div className="flex items-center gap-2 mb-2">
          <QrCode size={18} className="text-[var(--c-tc0694a)]" />
          <h2 className="text-lg font-semibold text-[var(--c-t1c1917)]">Location QR Codes</h2>
        </div>
        <p className="text-sm text-[var(--c-t78716c)]">
          Add locations to this board to generate location-tagged QR code variants.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-bd6cabf)] p-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <QrCode size={18} className="text-[var(--c-tc0694a)]" />
          <h2 className="text-lg font-semibold text-[var(--c-t1c1917)]">Location QR Codes</h2>
        </div>
        <p className="text-sm text-[var(--c-t78716c)]">
          Generate printable QR variants that pre-tag each submission with a location.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-5 items-start">
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium text-[var(--c-t1c1917)] mb-1.5">Location</span>
            <select
              value={activeLocation}
              onChange={(event) => setSelectedLocation(event.target.value)}
              className="w-full px-3 py-2 border border-[var(--c-bd6cabf)] rounded-lg bg-[var(--c-sffffff)] text-sm text-[var(--c-t1c1917)] focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]"
            >
              {locations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--c-t78716c)] mb-1">Tagged URL</p>
            <code className="block rounded-lg border border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] px-3 py-2 text-xs text-[var(--c-t1c1917)] break-all">
              {selectedUrl}
            </code>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={downloadSelected}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--c-sc0694a)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--c-s246d8b)] transition-colors"
            >
              <Download size={16} />
              Download PNG
            </button>
            <button
              onClick={downloadAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--c-sf5e6df)] text-[var(--c-t9c4a2f)] rounded-lg text-sm font-semibold hover:bg-[var(--c-sd7ecf7)] transition-colors"
            >
              <FileArchive size={16} />
              Download All as ZIP
            </button>
          </div>

          {progress && (
            <div className="rounded-lg bg-[var(--c-sf5f0ec)] border border-[var(--c-bd6cabf)] p-3">
              <div className="flex items-center justify-between text-xs text-[var(--c-t78716c)] mb-2">
                <span>Packaging QR codes…</span>
                <span>{progress.completed} / {progress.total}</span>
              </div>
              <div className="h-2 bg-[var(--c-se9e0d9)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--c-sc0694a)] transition-all"
                  style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] p-4 text-center printable-qr-card">
          <div className="inline-block bg-[var(--c-sffffff)] p-3 rounded-lg border border-[var(--c-be9e0d9)]">
            <QRCodeCanvas
              ref={previewRef}
              value={selectedUrl}
              size={200}
              level="H"
              includeMargin
            />
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--c-sf1ebe5)] text-[var(--c-t78716c)] text-xs font-semibold">
            <MapPin size={12} />
            {activeLocation}
          </div>
        </div>
      </div>

      <div className="sr-only" aria-hidden="true">
        {locations.map((location) => (
          <QRCodeCanvas
            key={location}
            ref={(canvas) => { hiddenRefs.current[location] = canvas; }}
            value={buildLocationUrl(feedbackUrl, location)}
            size={512}
            level="H"
            includeMargin
          />
        ))}
      </div>
    </div>
  );
}

import { downloadBlob } from '../lib/download';

type ZipEntry = {
  name: string;
  data: Uint8Array;
};

const textEncoder = new TextEncoder();

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'location';
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(buffer: number[], value: number) {
  buffer.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(buffer: number[], value: number) {
  buffer.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function createZip(entries: ZipEntry[]): Blob {
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const filename = textEncoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const localHeader: number[] = [];

    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint32(localHeader, checksum);
    writeUint32(localHeader, entry.data.length);
    writeUint32(localHeader, entry.data.length);
    writeUint16(localHeader, filename.length);
    writeUint16(localHeader, 0);

    const local = new Uint8Array(localHeader.length + filename.length);
    local.set(localHeader);
    local.set(filename, localHeader.length);
    chunks.push(local, entry.data);

    const centralHeader: number[] = [];
    writeUint32(centralHeader, 0x02014b50);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, checksum);
    writeUint32(centralHeader, entry.data.length);
    writeUint32(centralHeader, entry.data.length);
    writeUint16(centralHeader, filename.length);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, 0);
    writeUint32(centralHeader, offset);

    const central = new Uint8Array(centralHeader.length + filename.length);
    central.set(centralHeader);
    central.set(filename, centralHeader.length);
    centralDirectory.push(central);

    offset += local.length + entry.data.length;
  }

  const centralStart = offset;
  const centralSize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
  chunks.push(...centralDirectory);

  const endHeader: number[] = [];
  writeUint32(endHeader, 0x06054b50);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, entries.length);
  writeUint16(endHeader, entries.length);
  writeUint32(endHeader, centralSize);
  writeUint32(endHeader, centralStart);
  writeUint16(endHeader, 0);
  chunks.push(new Uint8Array(endHeader));

  const blobParts = chunks.map((chunk) => {
    const copy = new Uint8Array(chunk.byteLength);
    copy.set(chunk);
    return copy.buffer;
  });
  return new Blob(blobParts, { type: 'application/zip' });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to render QR code image.'));
    }, 'image/png');
  });
}

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

export function buildLocationUrl(baseUrl: string, location: string): string {
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('loc', location);
  return url.toString();
}

export async function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, filename);
}

export async function exportLocationQrZip({
  boardName,
  locations,
  renderCanvas,
  onProgress,
}: {
  boardName: string;
  locations: string[];
  renderCanvas: (location: string) => Promise<HTMLCanvasElement>;
  onProgress?: (completed: number, total: number) => void;
}) {
  const entries: ZipEntry[] = [];

  for (const [index, location] of locations.entries()) {
    const canvas = await renderCanvas(location);
    const blob = await canvasToBlob(canvas);
    entries.push({
      name: `${sanitizeFilename(boardName)}-${sanitizeFilename(location)}.png`,
      data: await blobToUint8Array(blob),
    });
    onProgress?.(index + 1, locations.length);
  }

  const zipBlob = createZip(entries);
  downloadBlob(zipBlob, `${sanitizeFilename(boardName)}-location-qr-codes.zip`);
}

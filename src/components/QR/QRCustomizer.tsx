import { useState, useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';
import type { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { Download, Upload, X, RotateCcw } from 'lucide-react';
import { Button } from '../Shared';

type FrameStyle = 'none' | 'simple' | 'banner' | 'dark' | 'rounded';
type LabelPosition = 'top' | 'bottom';

interface QRConfig {
  dotStyle: DotType;
  dotColor: string;
  backgroundColor: string;
  cornerSquareStyle: CornerSquareType;
  cornerDotStyle: CornerDotType;
  logo: string | null;
  logoSize: number;
  frameStyle: FrameStyle;
  frameColor: string;
  labelText: string;
  labelPosition: LabelPosition;
}

interface QRCustomizerProps {
  feedbackUrl: string;
  boardName: string;
}

const DEFAULT_CONFIG: QRConfig = {
  dotStyle: 'rounded',
  dotColor: '#1a237e',
  backgroundColor: '#ffffff',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  logo: null,
  logoSize: 0.3,
  frameStyle: 'none',
  frameColor: '#1a237e',
  labelText: 'Scan me!',
  labelPosition: 'bottom',
};

const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra-rounded', label: 'Extra Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy Rounded' },
];

const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'extra-rounded', label: 'Rounded' },
  { value: 'dot', label: 'Dot' },
];

const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
];

const FRAME_STYLES: { value: FrameStyle; label: string; desc: string }[] = [
  { value: 'none', label: 'None', desc: 'Plain QR' },
  { value: 'simple', label: 'Simple', desc: 'Border + label' },
  { value: 'banner', label: 'Banner', desc: 'Header label' },
  { value: 'dark', label: 'Dark Card', desc: 'Colored card' },
  { value: 'rounded', label: 'Rounded', desc: 'Soft edges' },
];

const PRESET_COLORS = [
  '#000000', '#1a237e', '#0d47a1', '#1565c0',
  '#c62828', '#6a1b9a', '#1b5e20', '#e65100',
  '#4267b2', '#25d366', '#e91e63', '#f59e0b',
];

const QR_SIZE = 220;
const FRAME_PADDING = 14;
const LABEL_HEIGHT = 42;

export function QRCustomizer({ feedbackUrl, boardName }: QRCustomizerProps) {
  const [config, setConfig] = useState<QRConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'dots' | 'logo' | 'frame'>('dots');
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);

  // Initialize QR code instance
  useEffect(() => {
    if (!qrRef.current) return;

    qrRef.current.innerHTML = '';
    qrCode.current = new QRCodeStyling({
      width: QR_SIZE,
      height: QR_SIZE,
      type: 'canvas',
      data: feedbackUrl,
      dotsOptions: { type: config.dotStyle, color: config.dotColor },
      backgroundOptions: { color: config.backgroundColor },
      cornersSquareOptions: { type: config.cornerSquareStyle, color: config.dotColor },
      cornersDotOptions: { type: config.cornerDotStyle, color: config.dotColor },
      qrOptions: { errorCorrectionLevel: 'H' },
      imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: config.logoSize },
    });
    qrCode.current.append(qrRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update QR code when config changes.
  // Also re-appends the canvas when FrameWrapper remounts qrRef's DOM node
  // (switching frame styles changes the wrapper structure, which unmounts/remounts children).
  useEffect(() => {
    if (!qrCode.current || !qrRef.current) return;
    if (!qrRef.current.hasChildNodes()) {
      qrCode.current.append(qrRef.current);
    }
    qrCode.current.update({
      data: feedbackUrl,
      dotsOptions: { type: config.dotStyle, color: config.dotColor },
      backgroundOptions: { color: config.backgroundColor },
      cornersSquareOptions: { type: config.cornerSquareStyle, color: config.dotColor },
      cornersDotOptions: { type: config.cornerDotStyle, color: config.dotColor },
      image: config.logo ?? undefined,
      imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: config.logoSize },
    });
  }, [config, feedbackUrl]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setConfig(prev => ({ ...prev, logo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  const downloadQR = async () => {
    if (!qrCode.current) return;

    if (config.frameStyle === 'none') {
      await qrCode.current.download({ name: `${boardName}-qr-code`, extension: 'png' });
      return;
    }

    const qrCanvas = qrRef.current?.querySelector('canvas');
    if (!qrCanvas) return;

    const scale = 2;
    const totalWidth = QR_SIZE + FRAME_PADDING * 2;
    const totalHeight = QR_SIZE + FRAME_PADDING * 2 + LABEL_HEIGHT;
    const r = config.frameStyle === 'rounded' ? 20 : 10;
    const isDark = config.frameStyle === 'dark';

    const out = document.createElement('canvas');
    out.width = totalWidth * scale;
    out.height = totalHeight * scale;
    const ctx = out.getContext('2d')!;
    ctx.scale(scale, scale);

    // Outer shape
    ctx.fillStyle = isDark ? config.frameColor : '#ffffff';
    if (config.frameStyle === 'simple' || config.frameStyle === 'banner') {
      drawRoundedRect(ctx, 0, 0, totalWidth, totalHeight, r);
      ctx.fill();
      ctx.strokeStyle = config.frameColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    } else {
      drawRoundedRect(ctx, 0, 0, totalWidth, totalHeight, r);
      ctx.fill();
    }

    // QR area position
    const qrY = config.labelPosition === 'top' ? LABEL_HEIGHT : FRAME_PADDING;

    // White background for QR area (dark frame only needs inner white box)
    if (isDark) {
      ctx.fillStyle = '#ffffff';
      const insetR = 6;
      drawRoundedRect(ctx, FRAME_PADDING, qrY, QR_SIZE, QR_SIZE, insetR);
      ctx.fill();
    }

    // Draw QR code image
    ctx.drawImage(qrCanvas, FRAME_PADDING, qrY, QR_SIZE, QR_SIZE);

    // Label band
    const labelY = config.labelPosition === 'top' ? 0 : qrY + QR_SIZE;
    ctx.fillStyle = config.frameColor;
    if (config.frameStyle === 'simple' || config.frameStyle === 'banner') {
      // Solid label rectangle (clip to rounded outer shape)
      ctx.save();
      drawRoundedRect(ctx, 0, 0, totalWidth, totalHeight, r);
      ctx.clip();
      ctx.fillRect(0, labelY, totalWidth, LABEL_HEIGHT);
      ctx.restore();
    } else if (!isDark) {
      ctx.fillRect(0, labelY, totalWidth, LABEL_HEIGHT);
    }

    // Label text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 16px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.labelText, totalWidth / 2, labelY + LABEL_HEIGHT / 2);

    const link = document.createElement('a');
    link.href = out.toDataURL('image/png');
    link.download = `${boardName}-qr-code.png`;
    link.click();
  };

  const downloadSVG = async () => {
    if (!qrCode.current) return;
    await qrCode.current.download({ name: `${boardName}-qr-code`, extension: 'svg' });
  };

  const set = <K extends keyof QRConfig>(key: K, value: QRConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-5">

      {/* Live Preview */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#7A8B9A]">Preview</p>
        <div className="flex items-center justify-center min-h-[260px]">
          <FrameWrapper config={config}>
            <div ref={qrRef} />
          </FrameWrapper>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#D3D1C7]">
        {(['dots', 'logo', 'frame'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-[#2E86AB] text-[#2E86AB]'
                : 'text-[#7A8B9A] hover:text-[#1E3A5F]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dots Tab */}
      {activeTab === 'dots' && (
        <div className="space-y-5">
          {/* Dot Style */}
          <div>
            <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Dot Style</label>
            <div className="grid grid-cols-3 gap-2">
              {DOT_STYLES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => set('dotStyle', value)}
                  className={`py-2 px-1 text-xs rounded-md border transition-all ${
                    config.dotStyle === value
                      ? 'border-[#2E86AB] bg-[#EBF5FB] text-[#2E86AB] font-semibold'
                      : 'border-[#D3D1C7] text-[#7A8B9A] hover:border-[#2E86AB]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Square Style */}
          <div>
            <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Corner Square</label>
            <div className="flex gap-2">
              {CORNER_SQUARE_STYLES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => set('cornerSquareStyle', value)}
                  className={`flex-1 py-2 text-xs rounded-md border transition-all ${
                    config.cornerSquareStyle === value
                      ? 'border-[#2E86AB] bg-[#EBF5FB] text-[#2E86AB] font-semibold'
                      : 'border-[#D3D1C7] text-[#7A8B9A] hover:border-[#2E86AB]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Dot Style */}
          <div>
            <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Corner Dot</label>
            <div className="flex gap-2">
              {CORNER_DOT_STYLES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => set('cornerDotStyle', value)}
                  className={`flex-1 py-2 text-xs rounded-md border transition-all ${
                    config.cornerDotStyle === value
                      ? 'border-[#2E86AB] bg-[#EBF5FB] text-[#2E86AB] font-semibold'
                      : 'border-[#D3D1C7] text-[#7A8B9A] hover:border-[#2E86AB]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* QR Color */}
          <div>
            <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">QR Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => set('dotColor', color)}
                  title={color}
                  style={{ backgroundColor: color }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    config.dotColor === color ? 'border-[#2E86AB] scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.dotColor}
                onChange={e => set('dotColor', e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-[#D3D1C7]"
              />
              <span className="text-sm text-[#7A8B9A] font-mono">{config.dotColor}</span>
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={e => set('backgroundColor', e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-[#D3D1C7]"
              />
              <span className="text-sm text-[#7A8B9A] font-mono">{config.backgroundColor}</span>
            </div>
          </div>
        </div>
      )}

      {/* Logo Tab */}
      {activeTab === 'logo' && (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Center Logo</label>
            <p className="text-xs text-[#7A8B9A] mb-3">
              Add your brand logo to the center. Use high-error-correction (H) for best results.
            </p>
            {config.logo ? (
              <div className="flex items-center gap-3 p-3 bg-[#F0F4F8] rounded-lg">
                <img
                  src={config.logo}
                  alt="Logo"
                  className="w-12 h-12 rounded object-contain border border-[#D3D1C7] bg-white"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1E3A5F]">Logo uploaded</p>
                  <p className="text-xs text-[#7A8B9A]">Shown in QR center</p>
                </div>
                <button
                  onClick={() => set('logo', null)}
                  className="text-[#7A8B9A] hover:text-[#E74C3C] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-[#D3D1C7] rounded-lg cursor-pointer hover:border-[#2E86AB] hover:bg-[#EBF5FB] transition-all">
                <Upload size={24} className="text-[#7A8B9A]" />
                <span className="text-sm font-medium text-[#1E3A5F]">Upload logo image</span>
                <span className="text-xs text-[#7A8B9A]">PNG, JPG, SVG — recommended square</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            )}
          </div>

          {config.logo && (
            <div>
              <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">
                Logo Size — {Math.round(config.logoSize * 100)}%
              </label>
              <input
                type="range"
                min="15"
                max="40"
                value={Math.round(config.logoSize * 100)}
                onChange={e => set('logoSize', parseInt(e.target.value) / 100)}
                className="w-full accent-[#2E86AB]"
              />
              <div className="flex justify-between text-xs text-[#7A8B9A] mt-1">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Frame Tab */}
      {activeTab === 'frame' && (
        <div className="space-y-5">
          {/* Frame Style */}
          <div>
            <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Frame Style</label>
            <div className="grid grid-cols-3 gap-2">
              {FRAME_STYLES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => set('frameStyle', value)}
                  className={`py-2 px-2 rounded-md border transition-all text-left ${
                    config.frameStyle === value
                      ? 'border-[#2E86AB] bg-[#EBF5FB]'
                      : 'border-[#D3D1C7] hover:border-[#2E86AB]'
                  }`}
                >
                  <p className={`text-xs font-semibold ${config.frameStyle === value ? 'text-[#2E86AB]' : 'text-[#1E3A5F]'}`}>
                    {label}
                  </p>
                  <p className="text-[10px] text-[#7A8B9A]">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {config.frameStyle !== 'none' && (
            <>
              {/* Frame Color */}
              <div>
                <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Frame Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.slice(0, 8).map(color => (
                    <button
                      key={color}
                      onClick={() => set('frameColor', color)}
                      title={color}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        config.frameColor === color ? 'border-[#2E86AB] scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.frameColor}
                    onChange={e => set('frameColor', e.target.value)}
                    className="w-9 h-9 rounded cursor-pointer border border-[#D3D1C7]"
                  />
                  <span className="text-sm text-[#7A8B9A] font-mono">{config.frameColor}</span>
                </div>
              </div>

              {/* Label Text */}
              <div>
                <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Label Text</label>
                <input
                  type="text"
                  value={config.labelText}
                  onChange={e => set('labelText', e.target.value)}
                  maxLength={24}
                  placeholder="e.g. Scan me!"
                  className="w-full px-3 py-2 border border-[#D3D1C7] rounded-md text-sm text-[#1E3A5F] bg-white focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
                />
              </div>

              {/* Label Position */}
              <div>
                <label className="text-sm font-medium text-[#1E3A5F] mb-2 block">Label Position</label>
                <div className="flex gap-2">
                  {(['top', 'bottom'] as const).map(pos => (
                    <button
                      key={pos}
                      onClick={() => set('labelPosition', pos)}
                      className={`flex-1 py-2 text-sm rounded-md border capitalize transition-all ${
                        config.labelPosition === pos
                          ? 'border-[#2E86AB] bg-[#EBF5FB] text-[#2E86AB] font-semibold'
                          : 'border-[#D3D1C7] text-[#7A8B9A] hover:border-[#2E86AB]'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2 border-t border-[#D3D1C7]">
        <div className="flex gap-2">
          <Button
            onClick={downloadQR}
            variant="primary"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download PNG
          </Button>
          {config.frameStyle === 'none' && (
            <Button
              onClick={downloadSVG}
              variant="secondary"
              className="flex items-center justify-center gap-2 px-4"
            >
              SVG
            </Button>
          )}
        </div>
        <button
          onClick={() => setConfig(DEFAULT_CONFIG)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#7A8B9A] hover:text-[#1E3A5F] transition-colors"
        >
          <RotateCcw size={12} />
          Reset to default
        </button>
      </div>
    </div>
  );
}

// ── Frame preview wrapper ──────────────────────────────────────────────────

function FrameWrapper({ config, children }: { config: QRConfig; children: React.ReactNode }) {
  const { frameStyle, frameColor, labelText, labelPosition, backgroundColor } = config;

  if (frameStyle === 'none') {
    return (
      <div style={{ background: backgroundColor, padding: 12, borderRadius: 8, border: '1px solid #D3D1C7' }}>
        {children}
      </div>
    );
  }

  const label = (
    <div
      style={{
        background: frameColor,
        padding: '8px 16px',
        textAlign: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '0.02em',
      }}
    >
      {labelText}
    </div>
  );

  const isDark = frameStyle === 'dark';
  const borderRadius = frameStyle === 'rounded' ? 20 : 10;
  const border = (frameStyle === 'simple' || frameStyle === 'banner') ? `3px solid ${frameColor}` : 'none';

  return (
    <div
      style={{
        display: 'inline-block',
        borderRadius,
        border,
        overflow: 'hidden',
        background: isDark ? frameColor : backgroundColor,
      }}
    >
      {labelPosition === 'top' && label}

      {isDark ? (
        <div style={{ padding: 10 }}>
          <div style={{ background: '#ffffff', borderRadius: 6, overflow: 'hidden', padding: 4 }}>
            {children}
          </div>
        </div>
      ) : (
        <div style={{ background: backgroundColor, padding: 10 }}>
          {children}
        </div>
      )}

      {labelPosition === 'bottom' && label}
    </div>
  );
}

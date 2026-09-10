import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { ATTACHMENT_CONFIG, formatFileSize, isValidFileSize, isValidFileType } from '../../lib/attachments-config';

interface FileUploadInputProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number;
  disabled?: boolean;
  multiple?: boolean;
}

export function FileUploadInput({
  onFilesSelected,
  maxSize = ATTACHMENT_CONFIG.maxFileSize,
  disabled = false,
  multiple = true,
}: FileUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }

  function validateFiles(files: FileList | null): File[] {
    if (!files) return [];
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (!isValidFileType(file.name)) {
        errors.push(`${file.name}: Invalid file type`);
      } else if (!isValidFileSize(file.size, maxSize)) {
        errors.push(`${file.name}: Exceeds ${formatFileSize(maxSize)} limit`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      setTimeout(() => setError(''), 5000);
    }

    return validFiles;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) onFilesSelected(files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = validateFiles(e.currentTarget.files);
    if (files.length > 0) onFilesSelected(files);
  }

  function handleClick() {
    if (disabled) return;
    fileInputRef.current?.click();
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: `2px dashed ${dragActive
            ? "var(--brand-primary, #c0694a)"
            : "var(--brand-primary-border, #e8d5c9)"}`,
          borderRadius: 12,
          padding: "28px 20px",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.18s ease",
          background: dragActive
            ? "var(--brand-primary-bg, rgba(192,105,74,0.07))"
            : "var(--brand-primary-bg, rgba(192,105,74,0.02))",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          accept={ATTACHMENT_CONFIG.allowedFileTypes.map(ext => `.${ext}`).join(',')}
          className="hidden"
        />

        <div
          className="mx-auto mb-3 flex items-center justify-center rounded-xl"
          style={{
            width: 44,
            height: 44,
            background: "var(--brand-primary-bg, rgba(192,105,74,0.12))",
          }}
        >
          <Upload size={22} style={{ color: "var(--brand-primary, #c0694a)" }} />
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--brand-secondary, #1c1917)" }}>
          {dragActive ? "Drop files here" : "Drag files here or click to browse"}
        </p>
        <p className="text-xs text-[var(--c-t8f8680)]">
          {ATTACHMENT_CONFIG.allowedFileTypes.join(', ')} · Max {formatFileSize(maxSize)}
        </p>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-xl text-sm whitespace-pre-wrap"
          style={{
            background: "#FFF5F5",
            border: "1px solid #FCA5A5",
            color: "#c0392b",
          }}>
          {error}
        </div>
      )}
    </div>
  );
}

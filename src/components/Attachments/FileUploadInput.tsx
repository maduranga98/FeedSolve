import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
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
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = validateFiles(e.currentTarget.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
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
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-color-accent bg-blue-50' : 'border-color-border'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-color-accent hover:bg-blue-50'}
        `}
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

        <Upload size={32} className="mx-auto mb-2 text-color-accent" />
        <p className="text-sm font-medium text-color-primary mb-1">Drag files here or click to browse</p>
        <p className="text-xs text-color-muted-text">
          Supported: {ATTACHMENT_CONFIG.allowedFileTypes.join(', ')} (Max {formatFileSize(maxSize)})
        </p>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-color-error rounded text-sm text-color-error whitespace-pre-wrap">
          {error}
        </div>
      )}
    </div>
  );
}

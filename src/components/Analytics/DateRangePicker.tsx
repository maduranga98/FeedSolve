import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  formatDateRange,
  getDateRangePreset,
  type DateRange,
  type DateRangePreset,
} from '../../lib/date-ranges';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS: Array<{ key: DateRangePreset; label: string }> = [
  { key: '7days', label: 'Last 7 days' },
  { key: '30days', label: 'Last 30 days' },
  { key: '90days', label: 'Last 90 days' },
];

function toInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(toInputValue(value.from));
  const [to, setTo] = useState(toInputValue(value.to));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFrom(toInputValue(value.from));
    setTo(toInputValue(value.to));
  }, [value.from, value.to]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handlePreset = (preset: DateRangePreset) => {
    onChange(getDateRangePreset(preset));
    setOpen(false);
  };

  const handleApplyCustom = () => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return;
    if (fromDate > toDate) return;
    onChange({
      from: new Date(fromDate.setHours(0, 0, 0, 0)),
      to: new Date(toDate.setHours(23, 59, 59, 999)),
      preset: 'custom',
    });
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-[#D5DDE5] bg-white px-3.5 py-2 text-sm font-semibold text-[#1E3A5F] shadow-sm hover:border-[#2E86AB] hover:bg-[#F5FAFD] transition-colors"
      >
        <Calendar size={15} className="text-[#2E86AB]" />
        <span className="font-medium text-[#1E3A5F]">{formatDateRange(value)}</span>
        <ChevronDown size={14} className="text-[#6B7B8D]" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-[#E3EDF4] bg-white p-4 shadow-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7B8D]">
            Quick presets
          </p>
          <div className="mb-4 grid grid-cols-1 gap-1.5">
            {PRESETS.map((preset) => {
              const active = value.preset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handlePreset(preset.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#2E86AB] text-white'
                      : 'text-[#1E3A5F] hover:bg-[#EBF5FB]'
                  }`}
                >
                  <span>{preset.label}</span>
                  {active && <span className="text-xs opacity-90">Active</span>}
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7B8D]">
            Custom range
          </p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block text-xs font-medium text-[#6B7B8D] mb-1">From</span>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-[#D5DDE5] px-2.5 py-1.5 text-sm text-[#1E3A5F] focus:border-[#2E86AB] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-[#6B7B8D] mb-1">To</span>
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-[#D5DDE5] px-2.5 py-1.5 text-sm text-[#1E3A5F] focus:border-[#2E86AB] focus:outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleApplyCustom}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-[#2E86AB] to-[#1E3A5F] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            Apply custom range
          </button>
        </div>
      )}
    </div>
  );
}

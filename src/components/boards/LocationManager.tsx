import { useMemo, useState } from 'react';
import { MapPin, Plus, X } from 'lucide-react';
import type { Board, Company } from '../../types';
import { updateBoard } from '../../lib/firestore';

type Tier = Company['subscription']['tier'];

const LOCATION_LIMITS: Record<Tier, number | null> = {
  free: 1,
  starter: 20,
  growth: 50,
  business: null,
};

function limitLabel(limit: number | null): string {
  return limit === null ? 'Unlimited' : String(limit);
}

function upgradeCopy(tier: Tier, limit: number | null): string {
  if (limit === null) return '';
  if (tier === 'free') return "Free boards include 1 location. Upgrade to Starter for up to 20 locations.";
  if (tier === 'starter') return "You've reached the 20 location limit. Upgrade to Growth for up to 50 locations.";
  if (tier === 'growth') return "You've reached the 50 location limit. Upgrade to Pro for unlimited locations.";
  return '';
}

function parseLocations(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

interface LocationManagerProps {
  board: Board;
  company: Company | null;
  onBoardChange: (board: Board) => void;
}

export function LocationManager({ board, company, onBoardChange }: LocationManagerProps) {
  const [locationInput, setLocationInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = company?.subscription.tier || 'free';
  const limit = LOCATION_LIMITS[tier];
  const locations = useMemo(() => board.locations || [], [board.locations]);
  const atLimit = limit !== null && locations.length >= limit;

  const persistLocations = async (nextLocations: string[]) => {
    setSaving(true);
    setError(null);
    try {
      await updateBoard(board.id, { locations: nextLocations });
      onBoardChange({ ...board, locations: nextLocations });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update locations.');
    } finally {
      setSaving(false);
    }
  };

  const addLocations = async (incoming: string[]) => {
    const deduped = Array.from(new Set([...locations, ...incoming]));
    const next = limit === null ? deduped : deduped.slice(0, limit);
    const exceededLimit = deduped.length > next.length;
    if (next.length === locations.length) {
      if (exceededLimit) setError(upgradeCopy(tier, limit));
      return;
    }
    await persistLocations(next);
    if (exceededLimit) setError(upgradeCopy(tier, limit));
  };

  const handleAdd = async () => {
    const value = locationInput.trim();
    if (!value) return;
    if (atLimit) {
      setError(upgradeCopy(tier, limit));
      return;
    }
    await addLocations([value]);
    setLocationInput('');
  };

  const handleBulkAdd = async () => {
    const parsed = parseLocations(bulkInput);
    if (parsed.length === 0) return;
    if (atLimit) {
      setError(upgradeCopy(tier, limit));
      return;
    }
    await addLocations(parsed);
    setBulkInput('');
  };

  const handleDelete = async (location: string) => {
    await persistLocations(locations.filter((item) => item !== location));
  };

  return (
    <div className="bg-white rounded-xl border border-[#D3D1C7] p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={18} className="text-[#2E86AB]" />
            <h2 className="text-lg font-semibold text-[#1E3A5F]">Locations</h2>
          </div>
          <p className="text-sm text-[#6B7B8D]">
            Define physical spots for location-tagged QR code variants.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#EBF5FB] px-3 py-1 text-xs font-semibold text-[#185FA5]">
          {locations.length} / {limitLabel(limit)} locations
        </span>
      </div>

      {locations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {locations.map((location) => (
            <span
              key={location}
              className="inline-flex items-center gap-2 rounded-full bg-[#EFF3F6] px-3 py-1 text-xs font-medium text-[#6B7B8D]"
            >
              {location}
              <button
                onClick={() => handleDelete(location)}
                disabled={saving}
                className="text-[#9AABBF] hover:text-[#E74C3C] disabled:opacity-50"
                aria-label={`Delete ${location}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[#D3D1C7] bg-[#F1F5F8] p-4 text-sm text-[#6B7B8D]">
          No locations yet. Free boards can keep the default board QR; paid tiers can add location variants.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Add Location</label>
          <div className="flex gap-2">
            <input
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Table 7"
              className="min-w-0 flex-1 rounded-lg border border-[#D3D1C7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !locationInput.trim() || atLimit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E86AB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#246D8B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} />
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1E3A5F] mb-1.5">Bulk add comma-separated</label>
          <textarea
            value={bulkInput}
            onChange={(event) => setBulkInput(event.target.value)}
            placeholder="Table 1, Table 2, Table 3, Reception"
            rows={3}
            className="w-full rounded-lg border border-[#D3D1C7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E86AB]"
          />
          <button
            onClick={handleBulkAdd}
            disabled={saving || !bulkInput.trim() || atLimit}
            className="mt-2 rounded-lg bg-[#EBF5FB] px-3 py-2 text-sm font-semibold text-[#185FA5] hover:bg-[#D7ECF7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add all locations
          </button>
        </div>
      </div>

      {(error || atLimit) && (
        <div className="rounded-lg border border-[#F6D58F] bg-[#FFF8E6] p-3 text-sm text-[#8A5A00]">
          {error || upgradeCopy(tier, limit)}
        </div>
      )}
    </div>
  );
}

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
    <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-bd6cabf)] p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={18} className="text-[var(--c-tc0694a)]" />
            <h2 className="text-lg font-semibold text-[var(--c-t1c1917)]">Locations</h2>
          </div>
          <p className="text-sm text-[var(--c-t78716c)]">
            Define physical spots for location-tagged QR code variants.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--c-sf5e6df)] px-3 py-1 text-xs font-semibold text-[var(--c-t9c4a2f)]">
          {locations.length} / {limitLabel(limit)} locations
        </span>
      </div>

      {locations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {locations.map((location) => (
            <span
              key={location}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--c-sf1ebe5)] px-3 py-1 text-xs font-medium text-[var(--c-t78716c)]"
            >
              {location}
              <button
                onClick={() => handleDelete(location)}
                disabled={saving}
                className="text-[var(--c-t8f8680)] hover:text-[var(--c-tc0392b)] disabled:opacity-50"
                aria-label={`Delete ${location}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-[var(--c-bd6cabf)] bg-[var(--c-sf5f0ec)] p-4 text-sm text-[var(--c-t78716c)]">
          No locations yet. Free boards can keep the default board QR; paid tiers can add location variants.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--c-t1c1917)] mb-1.5">Add Location</label>
          <div className="flex gap-2">
            <input
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Table 7"
              className="min-w-0 flex-1 rounded-lg border border-[var(--c-bd6cabf)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]"
            />
            <button
              onClick={handleAdd}
              disabled={saving || !locationInput.trim() || atLimit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--c-sc0694a)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--c-s246d8b)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={15} />
              Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--c-t1c1917)] mb-1.5">Bulk add comma-separated</label>
          <textarea
            value={bulkInput}
            onChange={(event) => setBulkInput(event.target.value)}
            placeholder="Table 1, Table 2, Table 3, Reception"
            rows={3}
            className="w-full rounded-lg border border-[var(--c-bd6cabf)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-bc0694a)]"
          />
          <button
            onClick={handleBulkAdd}
            disabled={saving || !bulkInput.trim() || atLimit}
            className="mt-2 rounded-lg bg-[var(--c-sf5e6df)] px-3 py-2 text-sm font-semibold text-[var(--c-t9c4a2f)] hover:bg-[var(--c-sd7ecf7)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add all locations
          </button>
        </div>
      </div>

      {(error || atLimit) && (
        <div className="rounded-lg border border-[var(--c-bf6d58f)] bg-[var(--c-sfff8e6)] p-3 text-sm text-[var(--c-t8a5a00)]">
          {error || upgradeCopy(tier, limit)}
        </div>
      )}
    </div>
  );
}

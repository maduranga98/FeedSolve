interface LocationDatum {
  location: string;
  count: number;
}

export function LocationChart({ data }: { data: LocationDatum[] }) {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="bg-[var(--c-sffffff)] rounded-xl border border-[var(--c-be8ecf0)] p-6">
      <h2 className="text-lg font-semibold text-[var(--c-t1e3a5f)] mb-1">Submissions by Location</h2>
      <p className="text-sm text-[var(--c-t6b7b8d)] mb-5">Breakdown for location-tagged QR code submissions.</p>
      {data.length === 0 ? (
        <p className="text-sm text-[var(--c-t9aabbf)]">No location-tagged submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.location}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-[var(--c-t1e3a5f)]">{item.location}</span>
                <span className="text-[var(--c-t6b7b8d)]">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--c-seff3f6)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--c-s2e86ab)]"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface LocationDatum {
  location: string;
  count: number;
}

export function LocationChart({ data }: { data: LocationDatum[] }) {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="bg-white rounded-xl border border-[#E8ECF0] p-6">
      <h2 className="text-lg font-semibold text-[#1E3A5F] mb-1">Submissions by Location</h2>
      <p className="text-sm text-[#6B7B8D] mb-5">Breakdown for location-tagged QR code submissions.</p>
      {data.length === 0 ? (
        <p className="text-sm text-[#9AABBF]">No location-tagged submissions yet.</p>
      ) : (
        <div className="space-y-3">
          {data.map((item) => (
            <div key={item.location}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-[#1E3A5F]">{item.location}</span>
                <span className="text-[#6B7B8D]">{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-[#EFF3F6] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2E86AB]"
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

import { TrendingUp } from 'lucide-react';

interface ResolutionRateCardProps {
  rate: number;
  resolved: number;
  total: number;
}

export default function ResolutionRateCard({
  rate,
  resolved,
  total,
}: ResolutionRateCardProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2E86AB] rounded-lg p-8 text-white shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm font-medium opacity-90">Resolution Rate</p>
          <p className="text-4xl font-bold mt-1">{rate.toFixed(1)}%</p>
        </div>
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255, 255, 255, 1)"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
            />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <TrendingUp size={16} />
        <span>
          {resolved} of {total} submissions resolved
        </span>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Zap } from 'lucide-react';
import { useTrialStatus } from '../../hooks/useTrialStatus';

export function TrialBanner() {
  const { isTrial, isExpired, daysRemaining } = useTrialStatus();
  const navigate = useNavigate();

  if (!isTrial) return null;

  if (isExpired) {
    return (
      <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0" />
          <span>Your 7-day free trial has expired. Add a payment method to keep using FeedSolve.</span>
        </div>
        <button
          onClick={() => navigate('/pricing')}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-white text-red-600 rounded-md font-medium hover:bg-red-50 transition-colors"
        >
          <Zap size={13} />
          Upgrade now
        </button>
      </div>
    );
  }

  const isUrgent = daysRemaining <= 2;

  return (
    <div
      className={`px-4 py-2.5 flex items-center justify-between gap-4 text-sm ${
        isUrgent ? 'bg-amber-500 text-white' : 'bg-[#1E3A5F] text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <Clock size={15} className="shrink-0" />
        <span>
          {daysRemaining === 1
            ? 'Your free trial expires tomorrow.'
            : `Your free trial ends in ${daysRemaining} days.`}{' '}
          Upgrade to keep all your data and features.
        </span>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-colors ${
          isUrgent
            ? 'bg-white text-amber-600 hover:bg-amber-50'
            : 'bg-[#2E86AB] text-white hover:bg-[#1E6A8A]'
        }`}
      >
        <Zap size={13} />
        Upgrade
      </button>
    </div>
  );
}

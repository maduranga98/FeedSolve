import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-[#E74C3C] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
      <WifiOff size={20} />
      <span className="text-sm font-medium">You are offline. Changes may not sync.</span>
    </div>
  );
}

export function OfflineStatusBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="bg-[#FDE8E8] border-b border-[#E74C3C] px-4 py-3">
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <WifiOff size={16} className="text-[#E74C3C]" />
        <span className="text-sm text-[#A32D2D]">
          You are offline. Some features may be limited.{' '}
          <a href="/" className="underline font-medium">
            Retry
          </a>
        </span>
      </div>
    </div>
  );
}

export function OnlineStatusIndicator() {
  const isOnline = useNetworkStatus();

  return (
    <div className="flex items-center gap-1 text-xs">
      {isOnline ? (
        <>
          <div className="w-2 h-2 bg-[#27AE60] rounded-full" />
          <span className="text-[#27AE60]">Online</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-[#E74C3C] rounded-full" />
          <span className="text-[#E74C3C]">Offline</span>
        </>
      )}
    </div>
  );
}

import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-[var(--c-sc0392b)] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
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
    <div className="bg-[var(--c-sfde8e8)] border-b border-[var(--c-bc0392b)] px-4 py-3">
      <div className="flex items-center gap-2 max-w-7xl mx-auto">
        <WifiOff size={16} className="text-[var(--c-tc0392b)]" />
        <span className="text-sm text-[var(--c-ta32d2d)]">
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
          <div className="w-2 h-2 bg-[var(--c-s27ae60)] rounded-full" />
          <span className="text-[var(--c-t27ae60)]">Online</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 bg-[var(--c-sc0392b)] rounded-full" />
          <span className="text-[var(--c-tc0392b)]">Offline</span>
        </>
      )}
    </div>
  );
}

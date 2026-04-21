import { useEffect, useState } from 'react';
import { isOnline, setupOfflineListener } from '../lib/offline';

export function useNetworkStatus() {
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline());

  useEffect(() => {
    const unsubscribe = setupOfflineListener(setIsOnlineStatus);
    return unsubscribe;
  }, []);

  return isOnlineStatus;
}

export function useOfflineWarning(showWarning: boolean = true) {
  const isOnlineStatus = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  return {
    isOnline: isOnlineStatus,
    shouldShowWarning: showWarning && !isOnlineStatus && !dismissed,
    dismiss: () => setDismissed(true),
  };
}

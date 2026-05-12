import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export function NetworkIndicator() {
  const online = useNetworkStatus();
  if (online) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-warning text-warning-foreground text-sm rounded-full shadow-md">
      <WifiOff size={14} />
      Offline — entries will sync when reconnected
    </div>
  );
}

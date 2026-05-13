import { CaptureForm } from '../capture/CaptureForm';

export function QuickLog() {
  return (
    <div className="bg-card/90 backdrop-blur-xl rounded-2xl p-1 shadow-2xl border border-border/50 ring-1 ring-white/10 overflow-hidden">
      <CaptureForm minimal autoFocus={false} />
    </div>
  );
}

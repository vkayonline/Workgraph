import { CaptureForm } from '../capture/CaptureForm';

export function QuickLog() {
  return (
    <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-border/50 ring-1 ring-white/10">
      <CaptureForm minimal autoFocus={false} className="gap-2" />
    </div>
  );
}

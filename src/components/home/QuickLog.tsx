import { CaptureForm } from '../capture/CaptureForm';

export function QuickLog() {
  return (
    <div className="sticky bottom-4 mx-auto w-full max-w-2xl bg-faint/50 backdrop-blur-md rounded-xl p-1 shadow-2xl border border-border/50">
      <CaptureForm minimal className="gap-2" />
    </div>
  );
}

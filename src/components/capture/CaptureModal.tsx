import { X } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { CaptureForm } from './CaptureForm';

interface CaptureModalProps {
  open: boolean;
  onClose: () => void;
}

export function CaptureModal({ open, onClose }: CaptureModalProps) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-foreground">Capture</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-sm p-0.5 focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <CaptureForm onSuccess={onClose} autoFocus={open} />
      </div>
    </Modal>
  );
}

import { X } from 'lucide-react';
import type { EntryImage } from '../../types';

interface ImagePreviewProps {
  image: EntryImage;
  onRemove: (id: string) => void;
}

export function ImagePreview({ image, onRemove }: ImagePreviewProps) {
  return (
    <div className="relative group w-20 h-20">
      <img
        src={image.data_url}
        alt={image.file_name}
        className="w-full h-full object-cover rounded-md border border-border"
      />
      <button
        onClick={() => onRemove(image.id)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-danger-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${image.file_name}`}
      >
        <X size={10} />
      </button>
    </div>
  );
}

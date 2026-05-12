import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { X, Paperclip } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Spinner } from '../shared/Spinner';
import { useCapture } from '../../hooks/useCapture';
import { TemplatePicker } from './TemplatePicker';
import { ImagePreview } from './ImagePreview';
import type { EntryType, EntryImage } from '../../types';
import { TEMPLATES } from '../../data/templates';

interface CaptureModalProps {
  open: boolean;
  onClose: () => void;
}

export function CaptureModal({ open, onClose }: CaptureModalProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<EntryImage[]>([]);
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { submit, loading } = useCapture();

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setText('');
      setImages([]);
      setSelectedType(null);
    }
  }, [open]);

  function applyTemplate(type: EntryType) {
    const tpl = TEMPLATES.find((t) => t.entry_type === type);
    setSelectedType(type);
    if (tpl) setText(tpl.content);
    textareaRef.current?.focus();
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter((i) => i.type.startsWith('image/'));
    if (imageItems.length === 0) return;
    e.preventDefault();
    const newImages = await Promise.all(imageItems.map(readClipboardItem));
    setImages((prev) => [...prev, ...newImages]);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newImages = await Promise.all(
      files.filter((f) => f.type.startsWith('image/')).map(readFile)
    );
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = '';
  }

  function removeImage(id: string) {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }

  async function handleSubmit() {
    if (!text.trim() && images.length === 0) return;
    await submit({ text, images, hintType: selectedType ?? undefined });
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-foreground">What's on your mind?</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-sm p-0.5 focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <TemplatePicker selected={selectedType} onSelect={applyTemplate} />

        <div className="mt-3 border-t border-border" />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Start typing..."
          rows={6}
          className="w-full mt-4 text-sm bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-none outline-none"
        />

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {images.map((img) => (
              <ImagePreview key={img.id} image={img} onRemove={removeImage} />
            ))}
          </div>
        )}

        <div className="mt-3 border-t border-border" />

        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Attach image"
          >
            <Paperclip size={14} />
            Attach
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && images.length === 0)}
          >
            {loading ? <Spinner size={16} /> : 'Save →'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

async function readClipboardItem(item: DataTransferItem): Promise<EntryImage> {
  return new Promise((resolve) => {
    const file = item.getAsFile()!;
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        data_url: reader.result as string,
        mime_type: file.type,
        file_name: file.name || 'pasted-image.png',
      });
    reader.readAsDataURL(file);
  });
}

async function readFile(file: File): Promise<EntryImage> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        data_url: reader.result as string,
        mime_type: file.type,
        file_name: file.name,
      });
    reader.readAsDataURL(file);
  });
}

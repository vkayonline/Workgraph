import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Paperclip } from 'lucide-react';
import { Spinner } from '../shared/Spinner';
import { useCapture } from '../../hooks/useCapture';
import { TemplatePicker } from './TemplatePicker';
import { ImagePreview } from './ImagePreview';
import type { EntryType, EntryImage } from '../../types';
import { TEMPLATES } from '../../data/templates';

interface CaptureFormProps {
  onSuccess?: () => void;
  className?: string;
  autoFocus?: boolean;
  minimal?: boolean;
}

export function CaptureForm({ onSuccess, className = '', autoFocus = false, minimal = false }: CaptureFormProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<EntryImage[]>([]);
  const [selectedType, setSelectedType] = useState<EntryType | null>(null);
  const [duration, setDuration] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { submit, loading } = useCapture();

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [autoFocus]);

  function applyTemplate(type: EntryType) {
    if (text.trim() && !window.confirm('Applying a template will replace your current content. Continue?')) {
      return;
    }
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
    const durationMin = duration.trim() ? parseInt(duration, 10) : undefined;
    await submit({
      text, images,
      hintType: selectedType ?? undefined,
      durationMinutes: durationMin && !isNaN(durationMin) ? durationMin : undefined,
    });
    setText('');
    setImages([]);
    setSelectedType(null);
    setDuration('');
    onSuccess?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {!minimal && (
        <TemplatePicker selected={selectedType} onSelect={applyTemplate} />
      )}

      <div className={`flex flex-col border border-border rounded-lg bg-card shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10`}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind? (Cmd+Enter to save)"
          rows={minimal ? 1 : 4}
          className="w-full p-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-none outline-none font-mono max-h-64 overflow-y-auto"
          onInput={(e) => {
            if (minimal) {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }
          }}
        />

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-3">
            {images.map((img) => (
              <ImagePreview key={img.id} image={img} onRemove={removeImage} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-faint/30">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
            >
              <Paperclip size={14} className="group-hover:rotate-12 transition-transform" />
              <span className="font-medium">Attach</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedType === 'work_log' && (
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</label>
                <input
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="min"
                  className="w-16 px-2 py-0.5 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && images.length === 0)}
            className="h-8 px-4 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--color-primary),white_25%)] transition-colors disabled:opacity-50 text-xs font-medium"
          >
            {loading ? <Spinner size={14} /> : (
              <span className="flex items-center gap-1.5">
                Save <kbd className="text-[10px] opacity-70">⌘↵</kbd>
              </span>
            )}
          </button>
        </div>
      </div>

      {minimal && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0 mr-1">Templates:</span>
          <TemplatePicker selected={selectedType} onSelect={applyTemplate} />
        </div>
      )}
    </div>
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

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { Paperclip, Send, Clock, Sparkles } from 'lucide-react';
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
  const [showTemplates, setShowTemplates] = useState(false);
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
    setShowTemplates(false);
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
    
    // Reset height if minimal
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Templates / Extra Controls */}
      {(showTemplates || !minimal) && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <TemplatePicker selected={selectedType} onSelect={applyTemplate} />
        </div>
      )}

      <div className={`flex flex-col ${minimal ? '' : 'border border-border rounded-xl bg-card shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'} overflow-hidden`}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder={minimal ? "Log something..." : "What's on your mind? (Cmd+Enter to save)"}
            rows={minimal ? 1 : 4}
            className={`w-full p-3 text-sm bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-none outline-none font-sans leading-relaxed max-h-64 overflow-y-auto ${minimal ? 'pr-10' : ''}`}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          
          {minimal && !text.trim() && images.length === 0 && (
            <div className="absolute right-3 top-3 pointer-events-none opacity-40">
              <kbd className="text-[10px] font-sans">⌘↵</kbd>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pb-3">
            {images.map((img) => (
              <ImagePreview key={img.id} image={img} onRemove={removeImage} />
            ))}
          </div>
        )}

        <div className={`flex items-center justify-between px-2 py-1.5 ${minimal ? '' : 'border-t border-border/50 bg-faint/30'}`}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
              title="Attach Image"
            >
              <Paperclip size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {minimal && (
              <button
                type="button"
                onClick={() => setShowTemplates(!showTemplates)}
                className={`p-2 rounded-lg transition-all ${showTemplates ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
                title="Use Template"
              >
                <Sparkles size={18} />
              </button>
            )}

            {selectedType === 'work_log' && (
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border/50">
                <Clock size={14} className="text-muted-foreground" />
                <input
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="min"
                  className="w-12 px-1 py-0.5 text-xs bg-transparent border-none focus:outline-none text-foreground font-medium"
                />
              </div>
            )}
            
            {selectedType && !minimal && (
              <div className="ml-2 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
                {selectedType.replace('_', ' ')}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && images.length === 0)}
            className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-[color-mix(in_srgb,var(--color-primary),white_25%)] transition-colors disabled:opacity-30 shadow-lg shadow-primary/20"
            aria-label="Save entry"
          >
            {loading ? <Spinner size={14} /> : <Send size={16} />}
          </button>
        </div>
      </div>
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

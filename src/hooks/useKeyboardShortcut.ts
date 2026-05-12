import { useEffect } from 'react';

interface Options {
  key: string;
  /** Requires Cmd (Mac) or Ctrl (Win/Linux) */
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  /**
   * When true, the shortcut is suppressed while an <input>, <textarea>,
   * or [contenteditable] element is focused — preventing accidental navigation
   * while the user is typing.
   */
  ignoreWhenInputFocused?: boolean;
  onTrigger: () => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcut({
  key,
  meta,
  ctrl,
  shift,
  ignoreWhenInputFocused = false,
  onTrigger,
}: Options) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (meta && !e.metaKey && !e.ctrlKey) return;
      if (ctrl && !e.ctrlKey) return;
      if (shift && !e.shiftKey) return;
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
      if (ignoreWhenInputFocused && isInputFocused()) return;
      e.preventDefault();
      onTrigger();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, meta, ctrl, shift, ignoreWhenInputFocused, onTrigger]);
}

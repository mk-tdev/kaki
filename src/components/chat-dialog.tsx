"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ChatDialog({ open, onClose, children }: { open: boolean; onClose: () => void; children?: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      element.querySelector<HTMLInputElement>("input")?.focus();
    } else if (!open && element.open) element.close();
  }, [open]);
  return <dialog ref={dialog} aria-label="Mission chat" onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[32px] border border-purple/15 bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/50">
    <button type="button" onClick={onClose} aria-label="Close chat" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-purple/10 text-purple hover:bg-purple/20"><X className="size-5" /></button>
    {children}
  </dialog>;
}

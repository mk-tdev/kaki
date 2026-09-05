"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export function Select({ value, onChange, options, label, disabled = false, className = "" }: {
  value: string; onChange: (value: string) => void; label: string;
  options: { value: string; label: string; hint?: string }[]; disabled?: boolean; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value);
  const search = useRef({ text: "", at: 0 });
  useEffect(() => {
    if (!open) return;
    (list.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]') ?? list.current?.querySelector("button"))?.focus();
    const outside = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  return <div ref={wrapper} className={`relative min-w-0 ${className}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <button ref={trigger} type="button" disabled={disabled} aria-label={`${label}: ${selected?.label ?? "Choose"}`} aria-haspopup="listbox" aria-expanded={open && !disabled} aria-controls={`${id}-options`} onClick={() => setOpen(current => !current)} onKeyDown={event => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); setOpen(true); } }} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-purple/20 bg-paper px-4 py-3 text-left text-sm font-bold text-ink shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-purple/20 disabled:cursor-not-allowed disabled:opacity-50">
      <span className="min-w-0"><span className="block">{selected?.label ?? "Choose"}</span>{selected?.hint ? <span className="block text-xs font-normal text-muted">{selected.hint}</span> : null}</span><ChevronDown className={`size-4 shrink-0 text-purple transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && !disabled ? <div ref={list} role="listbox" id={`${id}-options`} aria-label={label} className="absolute inset-x-0 top-full z-40 mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-[22px] border border-purple/20 bg-paper p-2 shadow-[0_16px_40px_#211d3530]" onKeyDown={event => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
      } else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey) {
        search.current.text = event.timeStamp - search.current.at > 700 ? event.key : search.current.text + event.key;
        search.current.at = event.timeStamp;
        buttons.find(button => button.textContent?.toLocaleLowerCase().startsWith(search.current.text.toLocaleLowerCase()))?.focus();
      }
    }}>{options.map(option => <button key={option.value} type="button" role="option" aria-selected={value === option.value} tabIndex={value === option.value ? 0 : -1} onClick={() => { onChange(option.value); close(); }} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-purple focus-visible:ring-offset-2 ${value === option.value ? "bg-purple text-white" : "text-ink hover:bg-purple/10"}`}><span>{option.label}{option.hint ? <span className="block text-xs font-normal opacity-70">{option.hint}</span> : null}</span>{value === option.value ? <Check className="size-4 shrink-0" /> : null}</button>)}</div> : null}
  </div>;
}

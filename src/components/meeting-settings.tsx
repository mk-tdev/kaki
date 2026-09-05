"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Clock3, MapPin } from "lucide-react";

const times = [
  { value: 15, label: "In about 15 minutes", hint: "A little help, soon" },
  { value: 60, label: "In about an hour", hint: "Time to get ready" },
  { value: 1440, label: "Tomorrow, around this time", hint: "Plan a neighbour moment" },
];

export function MeetingSettings({ location, onLocation, minutes, onMinutes, disabled = false }: {
  location: string; onLocation: (value: string) => void;
  minutes: number; onMinutes: (value: number) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const selected = times.find(time => time.value === minutes) ?? times[0];
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
    const closeOutside = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }

  return <div className="mt-6 space-y-5 rounded-[24px] border border-purple/10 bg-purple/5 p-4 sm:p-5">
    <label className="block text-sm font-black" htmlFor={`${id}-location`}>Where shall we meet?</label>
    <div className="relative !mt-2"><MapPin className="pointer-events-none absolute left-4 top-4 size-5 text-purple" /><input id={`${id}-location`} value={location} onChange={event => onLocation(event.target.value)} disabled={disabled} minLength={3} maxLength={160} aria-describedby={`${id}-location-hint`} className="min-h-14 w-full rounded-2xl border border-purple/15 bg-white py-3 pl-12 pr-4 text-sm font-bold text-ink outline-none focus:border-purple focus:ring-4 focus:ring-purple/10" placeholder="Choose a public meeting point" /></div>
    <p id={`${id}-location-hint`} className="!mt-2 text-xs leading-5 text-muted">Pek Kio is the default. You can choose another public place—please don’t enter a home address.</p>
    <div ref={wrapper} className="relative" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
      <p id={`${id}-label`} className="mb-2 text-sm font-black">When would you like to meet?</p>
      <button ref={trigger} type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-times`} aria-labelledby={`${id}-label ${id}-selected`} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); } }} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-purple/15 bg-white px-4 text-left shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-purple/15">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-purple/10 text-purple"><Clock3 className="size-4" /></span><span className="min-w-0 flex-1"><span id={`${id}-selected`} className="block text-sm font-black">{selected.label}</span><span className="block text-xs text-muted">{selected.hint}</span></span><ChevronDown className={`size-4 text-purple transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled ? <div ref={list} id={`${id}-times`} role="listbox" aria-labelledby={`${id}-label`} className="absolute inset-x-0 top-full z-30 mt-2 rounded-[22px] border border-purple/15 bg-paper p-2 shadow-[0_16px_45px_#211d3526]" onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); close(); return; }
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const options = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
        const current = options.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
        options[next]?.focus();
      }}>{times.map(time => <button key={time.value} type="button" role="option" aria-selected={time.value === minutes} tabIndex={time.value === minutes ? 0 : -1} onClick={() => { onMinutes(time.value); close(); }} className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left outline-none focus:ring-2 focus:ring-purple ${time.value === minutes ? "bg-purple text-white" : "text-ink hover:bg-purple/8"}`}><span><span className="block text-sm font-black">{time.label}</span><span className={`block text-xs ${time.value === minutes ? "text-white/70" : "text-muted"}`}>{time.hint}</span></span>{time.value === minutes ? <Check className="size-4 shrink-0" /> : null}</button>)}</div> : null}
    </div>
    <p className="!mt-2 text-xs text-muted">Preferred time only. Confirm the details with your neighbour.</p>
  </div>;
}

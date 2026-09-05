"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

type SuggestionState = {
  key: string;
  suggestions: string[];
  loading: boolean;
  unavailable: boolean;
};

const initialState: SuggestionState = { key: "", suggestions: [], loading: false, unavailable: false };

export function AiAssistanceSuggestions({ request, language, onSelect, disabled = false }: { request: string; language: string; onSelect: (suggestion: string) => void; disabled?: boolean }) {
  const [state, setState] = useState<SuggestionState>(initialState);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const trimmedRequest = request.trim();
  const requestKey = `${language}:${trimmedRequest}`;

  useEffect(() => {
    if (disabled || trimmedRequest.length < 3 || selectedKey === requestKey) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const timer = window.setTimeout(async () => {
      setState({ key: requestKey, suggestions: [], loading: true, unavailable: false });
      try {
        const response = await fetch("/api/ai/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request: trimmedRequest, language }),
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
        });
        const payload = await response.json() as { suggestions?: string[] };
        if (controller.signal.aborted) return;
        if (!response.ok || !payload.suggestions) throw new Error("Suggestions unavailable");
        setState({ key: requestKey, suggestions: payload.suggestions, loading: false, unavailable: false });
      } catch {
        if (controller.signal.aborted) return;
        setState({ key: requestKey, suggestions: [], loading: false, unavailable: true });
      }
    }, 350);

    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [disabled, language, requestKey, selectedKey, trimmedRequest]);

  function choose(suggestion: string) {
    activeRequest.current?.abort();
    setSelectedKey(`${language}:${suggestion.trim()}`);
    onSelect(suggestion);
  }

  if (disabled) return null;
  if (selectedKey === requestKey) return <p className="mt-4 text-sm font-bold text-kaki-green" role="status">Suggestion selected ✓ Edit your request to get new ideas, or create your mission.</p>;

  if (trimmedRequest.length < 3) return <p className="mt-4 text-center text-xs text-muted">Start typing and KAKI will suggest clearer ways to ask.</p>;

  const current = state.key === requestKey ? state : { ...initialState, loading: true };
  return <div className="mt-4" aria-live="polite"><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-purple"><Sparkles className={`size-4 ${current.loading ? "animate-pulse" : ""}`} />AI suggestions</div>{current.loading ? <div className="flex flex-wrap gap-2"><span className="h-9 w-40 animate-pulse rounded-full bg-purple/10" /><span className="h-9 w-52 animate-pulse rounded-full bg-purple/10" /><span className="h-9 w-44 animate-pulse rounded-full bg-purple/10" /></div> : current.suggestions.length ? <div className="flex flex-wrap gap-2">{current.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => choose(suggestion)} className="rounded-2xl border border-purple/15 bg-purple/7 px-4 py-2.5 text-left text-sm font-bold leading-5 text-purple-dark transition hover:-translate-y-0.5 hover:border-purple/35 hover:bg-purple/12">{suggestion}</button>)}</div> : current.unavailable ? <p className="text-xs text-muted">Live AI suggestions are temporarily unavailable. You can keep typing normally.</p> : null}{current.suggestions.length ? <p className="mt-2 text-[11px] text-muted">Generated live by OpenAI from your words—tap one to use it.</p> : null}</div>;
}

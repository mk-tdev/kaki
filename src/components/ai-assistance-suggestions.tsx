"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

type SuggestionState = {
  key: string;
  suggestions: string[];
  loading: boolean;
  unavailable: boolean;
};

const initialState: SuggestionState = { key: "", suggestions: [], loading: false, unavailable: false };

export function AiAssistanceSuggestions({ request, language, onSelect }: { request: string; language: string; onSelect: (suggestion: string) => void }) {
  const [state, setState] = useState<SuggestionState>(initialState);
  const trimmedRequest = request.trim();
  const requestKey = `${language}:${trimmedRequest}`;

  useEffect(() => {
    if (trimmedRequest.length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState({ key: requestKey, suggestions: [], loading: true, unavailable: false });
      try {
        const response = await fetch("/api/ai/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request: trimmedRequest, language }),
          signal: controller.signal,
        });
        const payload = await response.json() as { suggestions?: string[] };
        if (controller.signal.aborted) return;
        if (!response.ok || !payload.suggestions) throw new Error("Suggestions unavailable");
        setState({ key: requestKey, suggestions: payload.suggestions, loading: false, unavailable: false });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ key: requestKey, suggestions: [], loading: false, unavailable: true });
      }
    }, 900);

    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [language, requestKey, trimmedRequest]);

  if (trimmedRequest.length < 3) return <p className="mt-4 text-center text-xs text-muted">Start typing and KAKI will suggest clearer ways to ask.</p>;

  const current = state.key === requestKey ? state : { ...initialState, loading: true };
  return <div className="mt-4" aria-live="polite"><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-purple"><Sparkles className={`size-4 ${current.loading ? "animate-pulse" : ""}`} />AI suggestions</div>{current.loading ? <div className="flex flex-wrap gap-2"><span className="h-9 w-40 animate-pulse rounded-full bg-purple/10" /><span className="h-9 w-52 animate-pulse rounded-full bg-purple/10" /><span className="h-9 w-44 animate-pulse rounded-full bg-purple/10" /></div> : current.suggestions.length ? <div className="flex flex-wrap gap-2">{current.suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => onSelect(suggestion)} className="rounded-2xl border border-purple/15 bg-purple/7 px-4 py-2.5 text-left text-sm font-bold leading-5 text-purple-dark transition hover:-translate-y-0.5 hover:border-purple/35 hover:bg-purple/12">{suggestion}</button>)}</div> : current.unavailable ? <p className="text-xs text-muted">Live AI suggestions are temporarily unavailable. You can keep typing normally.</p> : null}{current.suggestions.length ? <p className="mt-2 text-[11px] text-muted">Generated live by OpenAI from your words—tap one to use it.</p> : null}</div>;
}

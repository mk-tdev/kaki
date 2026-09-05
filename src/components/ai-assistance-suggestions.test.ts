// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AiAssistanceSuggestions } from "./ai-assistance-suggestions";

let root: Root;
let container: HTMLDivElement;
const options = ["Help me share a photo", "Help me organise my photos", "Teach me to send pictures"];
const pause = () => new Promise(resolve => setTimeout(resolve, 420));
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.unstubAllGlobals(); });

function render(request: string, language = "English", disabled = false) {
  root.render(createElement(AiAssistanceSuggestions, { request, language, disabled, onSelect: value => render(value, language) }));
}

it("does not request new options after selection, but resumes after editing", async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ suggestions: options }) });
  vi.stubGlobal("fetch", fetchMock);
  await act(() => render("Help with photos"));
  await act(pause);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await act(() => (container.querySelector("button") as HTMLButtonElement).click());
  await act(pause);
  expect(container.textContent).toContain("Suggestion selected");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await act(() => render("Help me share a photo with family"));
  await act(pause);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("cancels obsolete calls and ignores responses arriving after input changes", async () => {
  const pending: Array<{ resolve: (response: unknown) => void; signal: AbortSignal }> = [];
  vi.stubGlobal("fetch", vi.fn((_url, init) => new Promise(resolve => pending.push({resolve, signal: init.signal}))));
  await act(() => render("Help with photos")); await act(pause);
  await act(() => render("Help with walking")); await act(pause);
  expect(pending[0].signal.aborted).toBe(true);
  await act(async () => pending[1].resolve({ok:true,json:async()=>({suggestions:["Take a short walk with me"]})}));
  await act(async () => pending[0].resolve({ok:true,json:async()=>({suggestions:options})}));
  expect(container.textContent).toContain("Take a short walk");
  expect(container.textContent).not.toContain("Help me share a photo");
});

it("does not generate while disabled or for very short input", async () => {
  const fetchMock=vi.fn(); vi.stubGlobal("fetch",fetchMock);
  await act(()=>render("Hi")); await act(pause);
  await act(()=>render("Help me", "English", true)); await act(pause);
  expect(fetchMock).not.toHaveBeenCalled();
});

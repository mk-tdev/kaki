// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { PresentationDeck } from "./presentation-deck";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
});

it("navigates the pitch and exposes speaker notes without a timer", async () => {
  await act(() => root.render(createElement(PresentationDeck, { qrCode: "data:image/png;base64,aGVsbG8=" })));
  expect(container.textContent).toContain("AI can answer");
  expect(container.querySelectorAll('[aria-label^="Go to scene"]')).toHaveLength(8);
  expect(container.textContent).not.toContain("5 minute pitch");
  expect(container.querySelector('[aria-label="Start pitch timer"]')).toBeNull();

  await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" })));
  expect(container.textContent).toContain("Today, I saw the idea.");

  await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "n" })));
  expect(container.querySelector('[aria-label="Speaker notes"]')).not.toBeNull();
  expect(container.textContent).toContain("Speaker note");

  await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(container.querySelector('[aria-label="Speaker notes"]')).toBeNull();

  await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "End" })));
  expect(container.textContent).toContain("Simple outside.");
  expect(container.textContent).toContain("PostgreSQL has no public endpoint");
  expect((container.querySelector('[aria-label="Next scene"]') as HTMLButtonElement).disabled).toBe(true);
});

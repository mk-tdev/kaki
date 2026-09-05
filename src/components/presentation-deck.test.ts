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

it("navigates the pitch and exposes timed speaker notes", async () => {
  await act(() => root.render(createElement(PresentationDeck, { qrCode: "data:image/png;base64,aGVsbG8=" })));
  expect(container.textContent).toContain("AI can answer");
  expect(container.querySelectorAll('[aria-label^="Go to scene"]')).toHaveLength(7);

  await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" })));
  expect(container.textContent).toContain("Today, I saw the idea.");

  await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "n" })));
  expect(container.querySelector('[aria-label="Speaker notes"]')).not.toBeNull();
  expect(container.textContent).toContain("Full pitch: 4:45");

  await act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(container.querySelector('[aria-label="Speaker notes"]')).toBeNull();
});

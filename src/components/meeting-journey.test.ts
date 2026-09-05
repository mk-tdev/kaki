// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MeetingSettings } from "./meeting-settings";
import { JourneyMap } from "./journey-map";
import { ChatDialog } from "./chat-dialog";
import { LeaveRequest } from "./leave-request";
import { demoMissions, profiles } from "@/data/demo";

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div"); document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => { await act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

it("supports themed keyboard time selection and returns focus", async () => {
  const onMinutes = vi.fn();
  await act(() => root.render(createElement(MeetingSettings, { location: "Pek Kio", onLocation: vi.fn(), minutes: 15, onMinutes })));
  const trigger = container.querySelector<HTMLButtonElement>('[aria-haspopup="listbox"]')!;
  await act(() => trigger.click());
  expect(document.activeElement?.getAttribute("aria-selected")).toBe("true");
  await act(() => document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
  await act(() => (document.activeElement as HTMLButtonElement).click());
  expect(onMinutes).toHaveBeenCalledWith(60);
  expect(container.querySelector('[role="listbox"]')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(container.querySelector("select")).toBeNull();
});

it("lets the requester replace the default meeting point", async () => {
  const onLocation = vi.fn();
  await act(() => root.render(createElement(MeetingSettings, { location: "Pek Kio", onLocation, minutes: 15, onMinutes: vi.fn() })));
  const input = container.querySelector("input")!;
  await act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Farrer Park MRT Exit A");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(onLocation).toHaveBeenCalledWith("Farrer Park MRT Exit A");
});

it("keeps both people distinct when only the requester checks in", async () => {
  const mission = { ...demoMissions[0], helper: profiles[1] };
  await act(() => root.render(createElement(JourneyMap, { mission, presence: [{mission_id: mission.id, user_id: mission.requester.id, arrived_at: "2026-09-05T05:00:00Z", on_way_at: null, consent_to_share: false, reflection: ""}] })));
  const markers = container.querySelectorAll<HTMLElement>("[data-person-id]");
  expect(markers).toHaveLength(2);
  expect(markers[0].style.left).not.toBe(markers[1].style.left);
  const statuses = container.querySelector('[aria-label="Participant statuses"]')!;
  expect(statuses.children[0].textContent).toContain("Checked in");
  expect(statuses.children[1].textContent).toContain("Not checked in");
});

it("opens chat only on demand and focuses the message input", async () => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  const onClose = vi.fn();
  const render = (open: boolean) => root.render(createElement(ChatDialog, { open, onClose }, createElement("input", { "aria-label": "Message" })));
  await act(() => render(false));
  expect(container.querySelector("dialog")!.open).toBe(false);
  await act(() => render(true));
  expect(container.querySelector("dialog")!.open).toBe(true);
  expect(document.activeElement).toBe(container.querySelector("input"));
  await act(() => container.querySelector<HTMLButtonElement>('button[aria-label="Close chat"]')!.click());
  expect(onClose).toHaveBeenCalled();
  await act(() => render(false));
  expect(container.querySelector("dialog")!.open).toBe(false);
});

it("requires explicit confirmation to leave and supports keeping the plan", async () => {
  const confirm=vi.fn().mockResolvedValue(true);
  await act(()=>root.render(createElement(LeaveRequest,{matched:true,busy:false,onConfirm:confirm})));
  await act(()=>container.querySelector<HTMLButtonElement>('button')!.click());
  expect(confirm).not.toHaveBeenCalled();
  expect(container.textContent).toContain('ends the request for both');
  await act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent==='Keep the plan')!.click());
  expect(container.querySelector('[aria-label="Confirm cancellation"]')).toBeNull();
  await act(()=>container.querySelector<HTMLButtonElement>('button')!.click());
  await act(()=>Array.from(container.querySelectorAll('button')).find(button=>button.textContent==='Yes, cancel request')!.click());
  expect(confirm).toHaveBeenCalledTimes(1);
});

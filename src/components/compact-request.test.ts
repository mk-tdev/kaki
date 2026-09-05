// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import AskPage from "@/app/(product)/ask/page";
import { MissionReview } from "./mission-review";
import type { MissionDraft } from "@/lib/ai/schemas";
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock("./mission-provider",()=>({useMissions:()=>({addMission:vi.fn()})}));
vi.mock("./voice-request",()=>({VoiceRequest:()=>null}));
vi.mock("./translate-text",()=>({TranslateText:()=>null}));
vi.mock("./ai-assistance-suggestions",()=>({AiAssistanceSuggestions:()=>null}));
let root:Root;let container:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});container=document.createElement("div");document.body.append(container);root=createRoot(container);});
afterEach(async()=>{await act(()=>root.unmount());container.remove();});
const draft:MissionDraft={title:"Help with photos",summary:"Learn to share a photo.",originalRequest:"Help with photos",category:"digital",language:"English",durationMinutes:15,location:"Pek Kio Community Innovation Space",guide:["Meet in public.","Try sharing a photo.","Practise together."],safetyLevel:"community",safetyNote:"Do not share passwords."};
const props={draft,mode:"openai" as const,meetingOffset:15,onMeetingOffset:vi.fn(),onLocation:vi.fn(),error:"",publishing:false,onBack:vi.fn(),onPublish:vi.fn()};
it("clears the request and returns focus to the textarea",async()=>{
  await act(()=>root.render(createElement(AskPage)));
  const input=container.querySelector("textarea")!;
  await act(()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value")!.set!.call(input,"Help me share photos");input.dispatchEvent(new Event("input",{bubbles:true}));});
  const clear=Array.from(container.querySelectorAll("button")).find(button=>button.textContent==="Clear text")!;
  expect(clear.disabled).toBe(false);
  await act(()=>clear.click());
  expect(input.value).toBe("");expect(document.activeElement).toBe(input);expect(clear.disabled).toBe(true);
});
it("keeps meeting edits and helper guide collapsed without blocking the default",async()=>{
  await act(()=>root.render(createElement(MissionReview,props)));
  expect(Array.from(container.querySelectorAll("details")).every(item=>!item.open)).toBe(true);
  const publish=Array.from(container.querySelectorAll("button")).find(button=>button.textContent==="Find my Kaki")!;
  expect(publish.disabled).toBe(false);
  expect(container.textContent).not.toContain("Community-safe mission");
  await act(()=>container.querySelector("summary")!.click());
  expect(container.querySelector("details")!.open).toBe(true);
  expect(container.querySelector("input")!.value).toBe(draft.location);
});
it("keeps review warnings visible and preserves the organiser action",async()=>{
  await act(()=>root.render(createElement(MissionReview,{...props,draft:{...draft,safetyLevel:"review"}})));
  const warning=container.querySelector('[role="alert"]')!;
  expect(warning.textContent).toContain("Organiser review needed");expect(warning.closest("details")).toBeNull();
  expect(container.textContent).toContain("Send to organiser");expect(container.textContent).not.toContain("Find my Kaki");
});

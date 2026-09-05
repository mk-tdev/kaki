// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { demoMissions, profiles } from "@/data/demo";
import type { Mission } from "@/types/kaki";
import { MissionDetail } from "./mission-detail";

const state=vi.hoisted(()=>({value:{} as Record<string,unknown>}));
vi.mock("./mission-provider",()=>({useMissions:()=>state.value}));
vi.mock("./match-reveal",()=>({MatchReveal:()=>null}));
let root:Root;
let container:HTMLDivElement;
beforeEach(()=>{
  Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
  container=document.createElement("div");document.body.append(container);root=createRoot(container);
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({messages:[],presence:[]})}));
});
afterEach(async()=>{await act(()=>root.unmount());container.remove();vi.unstubAllGlobals();});

it("keeps the helper flow in shrinkable columns after accepting a mission",async()=>{
  const mission:Mission={...demoMissions[0],helper:undefined,status:"open"};
  const accept=vi.fn(async()=>{mission.helper=profiles[1];mission.status="matched";root.render(createElement(MissionDetail,{missionId:mission.id}));});
  state.value={profile:profiles[1],missions:[mission],acceptMission:accept};
  await act(()=>root.render(createElement(MissionDetail,{missionId:mission.id})));
  const button=Array.from(container.querySelectorAll("button")).find(button=>button.textContent?.includes("I’ve got this!"))!;
  await act(()=>button.click());
  expect(accept).toHaveBeenCalledWith(mission.id);
  expect(container.textContent).toContain("Waiting for both check-ins");
  const aside=container.querySelector("aside")!;
  expect(aside.className).toContain("min-w-0");
  expect(aside.parentElement?.className).toContain("grid-cols-1");
  expect(container.querySelectorAll("[data-person-id]")).toHaveLength(2);
});

for(const role of ["requester","helper"] as const) it(`shows cancellation for the ${role} and clears active journey after success`,async()=>{
  const mission:Mission={...demoMissions[0],helper:profiles[1],status:"matched"};
  const cancel=vi.fn(async()=>{mission.status="cancelled";root.render(createElement(MissionDetail,{missionId:mission.id}));});
  state.value={profile:role==="requester"?mission.requester:mission.helper,missions:[mission],cancelMission:cancel};
  await act(()=>root.render(createElement(MissionDetail,{missionId:mission.id})));
  const button=(name:string)=>Array.from(container.querySelectorAll("button")).find(button=>button.textContent===name)!;
  await act(()=>button("I can’t make it").click());
  expect(cancel).not.toHaveBeenCalled();
  await act(()=>button("Yes, cancel request").click());
  expect(cancel).toHaveBeenCalledWith(mission.id);
  expect(container.textContent).toContain("This request is closed");
  expect(container.querySelector('[aria-label="Journey progress"]')).toBeNull();
  expect(button("I’m here")).toBeUndefined();
  expect(button("I can’t make it")).toBeUndefined();
  expect(container.textContent).toContain(role==="requester"?"Ask again when ready":"Find another neighbour");
});

// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Select } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { VoiceRequest } from "./voice-request";
let root:Root;let container:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});container=document.createElement("div");document.body.append(container);root=createRoot(container);});
afterEach(async()=>{await act(()=>root.unmount());container.remove();vi.unstubAllGlobals();});
it("custom dropdown handles keyboard selection and Escape",async()=>{
  const change=vi.fn();
  await act(()=>root.render(createElement(Select,{label:"Sort",value:"soon",onChange:change,options:[{value:"soon",label:"Soonest"},{value:"short",label:"Shortest"}]})));
  const trigger=container.querySelector("button")!;
  await act(()=>trigger.click());
  await act(()=>document.activeElement?.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true})));
  await act(()=>(document.activeElement as HTMLButtonElement).click());
  expect(change).toHaveBeenCalledWith("short");expect(document.activeElement).toBe(trigger);
  await act(()=>trigger.click());await act(()=>document.activeElement?.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true})));
  expect(container.querySelector('[role="listbox"]')).toBeNull();expect(container.querySelector("select")).toBeNull();
});
it("custom checkbox retains native semantics and label activation",async()=>{
  const change=vi.fn();
  await act(()=>root.render(createElement("label",null,createElement(Checkbox,{onChange:change}),"Share our story")));
  await act(()=>container.querySelector("label")!.click());
  expect(container.querySelector("input")!.checked).toBe(true);expect(change).toHaveBeenCalledTimes(1);
});
it("handles denied microphone permission without blocking typed input",async()=>{
  const busy=vi.fn();vi.stubGlobal("navigator",{mediaDevices:{getUserMedia:vi.fn().mockRejectedValue(new DOMException("Denied","NotAllowedError"))}});
  vi.stubGlobal("MediaRecorder",class {});
  await act(()=>root.render(createElement(VoiceRequest,{onText:vi.fn(),onBusy:busy})));
  await act(()=>container.querySelector("button")!.click());
  expect(container.textContent).toContain("Microphone permission was denied");
  expect(busy).toHaveBeenLastCalledWith(false);
});
it("records then transcribes through KAKI and releases the microphone",async()=>{
  const stop=vi.fn();const onText=vi.fn();
  vi.stubGlobal("navigator",{mediaDevices:{getUserMedia:vi.fn().mockResolvedValue({getTracks:()=>[{stop}]})}});
  vi.stubGlobal("MediaRecorder",class {
    static isTypeSupported(){return true;}
    state="inactive";mimeType="audio/webm";
    ondataavailable:((event:{data:Blob})=>void)|null=null;onstop:(()=>void)|null=null;
    start(){this.state="recording";}
    stop(){this.state="inactive";this.ondataavailable?.({data:new Blob(["audio"],{type:this.mimeType})});this.onstop?.();}
  });
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({text:"Please help with photos"})});vi.stubGlobal("fetch",fetchMock);
  await act(()=>root.render(createElement(VoiceRequest,{onText,onBusy:vi.fn()})));
  await act(()=>container.querySelector("button")!.click());
  expect(container.textContent).toContain("Recording");
  await act(()=>container.querySelector("button")!.click());
  expect(fetchMock.mock.calls[0][0]).toBe("/api/ai/transcribe");
  expect(onText).toHaveBeenCalledWith("Please help with photos");expect(stop).toHaveBeenCalled();
});

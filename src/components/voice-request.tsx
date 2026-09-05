"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Square } from "lucide-react";
import { MAX_AUDIO_BYTES } from "@/lib/ai/language";

export function VoiceRequest({ onText, onBusy, disabled }: { onText:(text:string)=>void; onBusy:(busy:boolean)=>void; disabled?:boolean }) {
  const [phase,setPhase]=useState<"idle"|"permission"|"recording"|"processing">("idle");
  const [seconds,setSeconds]=useState(0);
  const [error,setError]=useState("");
  const recorder=useRef<MediaRecorder|null>(null);
  const stream=useRef<MediaStream|null>(null);
  const timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const abort=useRef<AbortController|null>(null);
  const generation=useRef(0);
  const callbacks=useRef({onText,onBusy});
  useEffect(()=>{callbacks.current={onText,onBusy};},[onText,onBusy]);
  function release() { stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;if(timer.current)clearInterval(timer.current);timer.current=null; }
  useEffect(()=>()=>{++generation.current;abort.current?.abort();if(recorder.current?.state==="recording"){recorder.current.onstop=null;recorder.current.stop();}stream.current?.getTracks().forEach(track=>track.stop());if(timer.current)clearInterval(timer.current);},[]);
  async function start() {
    if(phase!=="idle"||disabled)return;
    if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==="undefined"){setError("Microphone recording isn’t supported here. Please type your request.");return;}
    const id=++generation.current;
    setError("");setPhase("permission");callbacks.current.onBusy(true);
    try {
      const media=await navigator.mediaDevices.getUserMedia({audio:true});
      if(id!==generation.current){media.getTracks().forEach(track=>track.stop());return;}
      stream.current=media;
      const mime=["audio/webm;codecs=opus","audio/mp4","audio/webm"].find(type=>MediaRecorder.isTypeSupported(type));
      if(!mime)throw new Error("This browser cannot make a supported recording. Please type instead.");
      const current=new MediaRecorder(media,{mimeType:mime,audioBitsPerSecond:64000});
      recorder.current=current;
      const chunks:Blob[]=[];let bytes=0;let failed=false;
      current.ondataavailable=event=>{if(event.data.size){bytes+=event.data.size;chunks.push(event.data);if(bytes>MAX_AUDIO_BYTES&&current.state==="recording")current.stop();}};
      current.onerror=()=>{failed=true;if(current.state==="recording")current.stop();else {release();setPhase("idle");callbacks.current.onBusy(false);setError("Recording failed. Please try again.");}};
      current.onstop=async()=>{
        release();
        if(id!==generation.current)return;
        setPhase("processing");
        try {
          if(failed)throw new Error("Recording failed. Please try again.");
          if(!bytes||bytes>MAX_AUDIO_BYTES)throw new Error("Please record a shorter message.");
          const body=new FormData();body.append("audio",new Blob(chunks,{type:current.mimeType}),mime.includes("mp4")?"request.mp4":"request.webm");
          const controller=new AbortController();abort.current=controller;
          const timeout=setTimeout(()=>controller.abort(),25000);
          try {
            const response=await fetch("/api/ai/transcribe",{method:"POST",body,signal:controller.signal});
            const payload=await response.json();
            if(!response.ok)throw new Error(payload.error || "Could not transcribe. Please try again.");
            if(id===generation.current)callbacks.current.onText(payload.text);
          } finally {clearTimeout(timeout);}
        } catch(error){if(id===generation.current)setError(error instanceof Error&&error.name!=="AbortError"?error.message:"Transcription timed out. Please try again.");}
        finally {if(id===generation.current){setPhase("idle");callbacks.current.onBusy(false);}}
      };
      current.start(500);setSeconds(0);setPhase("recording");
      const began=Date.now();
      timer.current=setInterval(()=>{const elapsed=Math.floor((Date.now()-began)/1000);setSeconds(elapsed);if(elapsed>=45&&current.state==="recording")current.stop();},250);
    } catch(error){release();if(id===generation.current){setPhase("idle");callbacks.current.onBusy(false);setError((error instanceof Error || error instanceof DOMException)&&error.name==="NotAllowedError"?"Microphone permission was denied. Allow it in browser settings, or type below.":error instanceof Error?error.message:"Could not start recording.");}}
  }
  return <div className="mt-7 text-center">
    <button type="button" disabled={phase==="permission"||phase==="processing"||(disabled&&phase!=="recording")} onClick={()=>{if(phase==="recording"){if(recorder.current?.state==="recording")recorder.current.stop();}else void start();}} aria-label={phase==="recording"?"Stop recording":phase==="processing"?"Transcribing with OpenAI":"Record your request"} aria-pressed={phase==="recording"} className={`mx-auto grid size-24 place-items-center rounded-full text-white shadow-lg transition disabled:opacity-60 ${phase==="recording"?"bg-coral":"bg-purple hover:bg-purple-dark"}`}>{phase==="processing"||phase==="permission"?<LoaderCircle className="size-9 animate-spin"/>:phase==="recording"?<Square className="size-8 fill-white"/>:<Mic className="size-10"/>}</button>
    <p role="status" className="mt-3 text-sm font-black">{phase==="recording"?`Recording · ${seconds}/45s · tap to finish`:phase==="processing"?"OpenAI is transcribing…":phase==="permission"?"Allow microphone access…":"Tap and tell KAKI"}</p>
    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-muted">Recording sends your audio to OpenAI for transcription. KAKI doesn’t save the audio. Review the words before sharing.</p>
    {error?<p role="alert" className="mt-3 text-sm text-coral">{error}</p>:null}
  </div>;
}

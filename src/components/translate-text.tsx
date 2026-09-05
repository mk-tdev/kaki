"use client";
import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { languageOptions } from "@/lib/ai/language";
import { Select } from "@/components/ui/select";

export function TranslateText({text,language,onUse,disabled=false}:{text:string;language?:string;onUse?:(text:string)=>void;disabled?:boolean}) {
  const [target,setTarget]=useState("English");
  const [result,setResult]=useState<{source:string;language:string;text:string}|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const controller=useRef<AbortController|null>(null);
  const chosen=language??target;
  useEffect(()=>()=>controller.current?.abort(),[]);
  async function translate(){
    if(busy||disabled||!text.trim())return;
    setBusy(true);setError("");
    controller.current?.abort();controller.current=new AbortController();
    const timeout=setTimeout(()=>controller.current?.abort(),20000);
    try{
      const response=await fetch("/api/ai/translate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,language:chosen}),signal:controller.current.signal});
      const payload=await response.json();if(!response.ok)throw new Error(payload.error);
      setResult({source:text,language:chosen,text:payload.text});
    }catch(error){if(error instanceof Error&&error.name!=="AbortError")setError(error.message);else setError("Translation timed out. Try again.");}
    finally{clearTimeout(timeout);setBusy(false);}
  }
  const current=result?.source===text&&result.language===chosen?result:null;
  return <div className="mt-3 text-ink">
    {!language?<Select label="Translate into" value={target} onChange={setTarget} options={languageOptions} disabled={busy}/>:null}
    <button type="button" disabled={busy||disabled||!text.trim()} onClick={()=>void translate()} className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-purple/15 bg-paper px-4 text-xs font-bold text-purple disabled:opacity-50"><Languages className="size-4"/>{busy?"Translating…":`Translate to ${chosen}`}</button>
    {current?<div className="mt-2 rounded-2xl border border-purple/15 bg-paper p-3 text-sm leading-6"><p className="whitespace-pre-wrap break-words">{current.text}</p><p className="mt-2 text-[10px] text-muted">OpenAI translation · check names and meeting details</p>{onUse?<button type="button" disabled={disabled} onClick={()=>onUse(current.text)} className="mt-2 min-h-11 rounded-xl bg-purple px-4 text-xs font-bold text-white">Use this translation</button>:null}</div>:null}
    {error?<p role="alert" className="mt-2 text-xs text-coral">{error}</p>:null}
  </div>;
}

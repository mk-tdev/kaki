"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMissions } from "@/components/mission-provider";

const skills=["Phone & apps","Repair & reuse","Walking buddy","Cooking & sharing","Languages & stories"];
export function HelperDetails(){
  const {profile}=useMissions();const router=useRouter();
  const [selected,setSelected]=useState(profile.skills);
  const [language,setLanguage]=useState(profile.languages[0]||"");
  const [name,setName]=useState(profile.name);
  const [busy,setBusy]=useState(false);const [status,setStatus]=useState("");
  async function save(){setBusy(true);setStatus("");try{const response=await fetch("/api/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName:name,role:profile.role==="organiser"?"organiser":"helper",preferredLanguage:language||"Not specified",skills:selected})});if(!response.ok)throw new Error("Could not save. Check your name and try again.");setStatus("Saved. KAKI can use these details in your AI introduction.");router.refresh();}catch(error){setStatus(error instanceof Error?error.message:"Could not save.");}finally{setBusy(false);}}
  if(profile.role==="organiser")return null;
  return <details className="paper-card mt-6 rounded-[28px] p-5"><summary className="cursor-pointer text-sm font-black text-purple"><Sparkles className="mr-2 inline size-4"/>Make your introduction more personal <span className="ml-2 font-normal text-muted">Optional · skip and choose a mission</span></summary><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">What should your neighbour call you?<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} className="mt-2 block h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm"/></label><label className="text-xs font-bold">Comfortable language<select value={language} onChange={e=>setLanguage(e.target.value)} className="mt-2 block h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-sm"><option value="">Not shared yet</option>{["English","中文","Bahasa Melayu","தமிழ்"].map(item=><option key={item}>{item}</option>)}</select></label></div><p className="mb-3 mt-5 text-xs font-bold">I’m comfortable helping with</p><div className="flex flex-wrap gap-2">{skills.map(skill=><button key={skill} aria-pressed={selected.includes(skill)} onClick={()=>setSelected(current=>current.includes(skill)?current.filter(s=>s!==skill):[...current,skill])} className={`rounded-full border px-4 py-2.5 text-xs font-bold ${selected.includes(skill)?"border-purple bg-purple text-white":"border-ink/10 bg-white text-muted"}`}>{skill}</button>)}</div><div className="mt-5 flex flex-wrap items-center gap-4"><Button disabled={busy||name.trim().length<2} onClick={()=>void save()}>{busy?"Saving…":"Save my details"}</Button><p role="status" className="text-xs text-muted">{status||"Self-reported, not a verification check. No email needed."}</p></div></details>;
}

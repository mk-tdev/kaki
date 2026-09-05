"use client";
import { useState } from "react";
import { JourneyMap } from "@/components/journey-map";
import { BloomCelebration } from "@/components/bloom-celebration";
import { Button } from "@/components/ui/button";
import { demoMissions,profiles } from "@/data/demo";
import type { MissionPresence } from "@/types/kaki";

const stages=["Matched","On the way","Checked in","Sharing","Bloom"];
export default function JourneyPreview(){
  const [step,setStep]=useState(0);
  const mission={...demoMissions[0],helper:profiles[1],status:step===4?"completed" as const:step===3?"in_progress" as const:"matched" as const};
  const presence:MissionPresence[]=[mission.requester,mission.helper].map(person=>({mission_id:mission.id,user_id:person.id,on_way_at:step>0?"2026-09-05T05:00:00Z":null,arrived_at:step>1?"2026-09-05T05:15:00Z":null,consent_to_share:true,reflection:""}));
  return <div className="mx-auto max-w-3xl"><p className="text-xs font-black uppercase tracking-[.15em] text-purple">Visual rehearsal · simulated actions</p><h1 className="mt-3 text-4xl font-black tracking-tight">A small ask. A living story.</h1><p className="mt-4 text-sm leading-7 text-muted">These controls preview the animation only. No real mission, check-in, location or Bloom is created. Live missions advance only through participant actions.</p><div className="my-6 flex flex-wrap gap-2">{stages.map((stage,index)=><Button key={stage} variant={step===index?"primary":"secondary"} onClick={()=>setStep(index)} aria-pressed={step===index}>{index+1}. {stage}</Button>)}</div><JourneyMap mission={mission} presence={presence}/>{step===4?<div className="mt-6"><BloomCelebration shared={false}/></div>:null}</div>;
}

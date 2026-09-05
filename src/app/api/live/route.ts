import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(){
  const supabase=await createClient();
  // Explicit filter applies even when an organiser opens the public projection.
  const {data,error,count}=await supabase.from("blooms").select("id,title,story,category,participant_names,created_at",{count:"exact"}).eq("consent_to_share",true).order("created_at",{ascending:false}).limit(36);
  if(error)return NextResponse.json({error:"Could not load the community wall."},{status:503});
  return NextResponse.json({blooms:data,total:count??0},{headers:{"Cache-Control":"no-store"}});
}

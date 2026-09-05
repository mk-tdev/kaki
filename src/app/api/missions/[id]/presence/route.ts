import { NextResponse } from "next/server";
import { z } from "zod";
import { getIdentity } from "@/lib/auth/server";
import { query } from "@/lib/db/query";
const schema = z.object({ action: z.enum(["on_way", "check_in", "consent"]), consentToShare: z.boolean().optional() });
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getIdentity()) return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const {id}=await params;
    const presence=await query("select * from public.mission_presence where mission_id=$1",[id]);
    return NextResponse.json({presence},{headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"Could not load check-ins."},{status:500}); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const identity=await getIdentity();
  if (!identity) return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid check-in."},{status:400});
  const {id}=await params;
  const {action,consentToShare}=parsed.data;
  try {
    await query(`insert into public.mission_presence(mission_id,user_id,on_way_at,arrived_at,consent_to_share)
      values($1,$2,case when $3='on_way' then now() end,case when $3='check_in' then now() end,coalesce($4,false))
      on conflict(mission_id,user_id) do update set
      on_way_at=coalesce(mission_presence.on_way_at,excluded.on_way_at),
      arrived_at=coalesce(mission_presence.arrived_at,excluded.arrived_at),
      consent_to_share=coalesce($4,mission_presence.consent_to_share)`,[id,identity.sub,action,consentToShare ?? null]);
    return NextResponse.json({ok:true});
  } catch { return NextResponse.json({error:"Only a participant in an active mission can check in."},{status:409}); }
}

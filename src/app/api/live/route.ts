import { NextResponse } from "next/server";
import { transaction } from "@/lib/db/query";
export async function GET() {
  try {
    const result = await transaction(async client => {
      const blooms = await client.query("select id,title,story,category,participant_names,created_at from public.blooms where consent_to_share=true order by created_at desc limit 36");
      const count = await client.query<{count:string}>("select count(*) from public.blooms where consent_to_share=true");
      return {blooms:blooms.rows,total:Number(count.rows[0].count)};
    });
    return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
  } catch { return NextResponse.json({error:"Could not load shared moments."},{status:503}); }
}

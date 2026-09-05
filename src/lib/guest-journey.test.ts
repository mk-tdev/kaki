import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Real PostgreSQL policy/trigger execution in memory; never calls Supabase cloud.
const db=new PGlite();
const requester="10000000-0000-4000-8000-000000000001";
const helper="20000000-0000-4000-8000-000000000002";
const stranger="30000000-0000-4000-8000-000000000003";
let mission:string;
async function asUser(id:string,sql:string){
  await db.exec(`set role authenticated; select set_config('request.jwt.claims','${JSON.stringify({sub:id,is_anonymous:true})}',false);`);
  return db.exec(sql);
}
async function admin(sql:string){await db.exec("reset role; select set_config('request.jwt.claims','{}',false);");return db.exec(sql);}
beforeAll(async()=>{
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}', is_anonymous boolean default false);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    grant execute on all functions in schema auth to anon,authenticated;`);
  for(const file of (await readdir("supabase/migrations")).filter(f=>f.endsWith(".sql")).sort()){
    // PGlite has no replication transport. All RLS and trigger SQL stays intact.
    const sql=(await readFile(`supabase/migrations/${file}`,"utf8")).replace(/alter publication supabase_realtime add table public\.\w+;/g,"");
    try { await db.exec(sql); } catch (error) { const detail=error as {message:string;position?:string;internalQuery?:string}; throw new Error(`${file}: ${detail.message}; position ${detail.position}; internal ${detail.internalQuery ?? ""}`); }
  }
  await admin(`insert into auth.users(id,is_anonymous) values('${requester}',true),('${helper}',true),('${stranger}',true);`);
},30000);
afterAll(async()=>{await db.close();});
describe("Guest journey database boundaries",()=>{
  it("creates unverified onboarded guest profiles without invented languages",async()=>{
    const results=await asUser(requester,`select full_name,onboarded_at,is_guest,spoken_languages,verified_at from public.profiles where id='${requester}'`);
    expect(results[0].rows[0]).toMatchObject({is_guest:true,spoken_languages:[],verified_at:null});
    expect(results[0].rows[0]).toHaveProperty("onboarded_at");
    await expect(asUser(requester,`update public.profiles set role='organiser' where id='${requester}'`)).rejects.toThrow(/Organiser/);
  });
  it("publishes real guest content and allows only one other helper to claim",async()=>{
    const result=await asUser(requester,`insert into public.missions(requester_id,title,original_request,summary,category,status,duration_minutes,location_label,scheduled_at) values('${requester}','Help with photos','Help me share photos','Learn to share photos together','digital','open',20,'Pek Kio Community Innovation Space',now()) returning id,is_demo`);
    mission=(result[0].rows[0] as {id:string}).id;
    expect(result[0].rows[0]).toHaveProperty("is_demo",true);
    await expect(asUser(requester,`update public.missions set helper_id='${requester}',status='matched' where id='${mission}'`)).rejects.toThrow();
    await asUser(helper,`update public.missions set helper_id='${helper}',status='matched' where id='${mission}'`);
    const hidden=await asUser(stranger,`select id from public.missions where id='${mission}'`);
    expect(hidden[0].rows).toEqual([]);
  });
  it("rejects premature start, impersonated arrivals and stranger chat",async()=>{
    await expect(asUser(helper,`update public.missions set status='in_progress' where id='${mission}'`)).rejects.toThrow(/Both neighbours/);
    await expect(asUser(helper,`insert into public.mission_presence(mission_id,user_id,arrived_at) values('${mission}','${requester}',now())`)).rejects.toThrow();
    await expect(asUser(stranger,`insert into public.mission_messages(mission_id,sender_id,body) values('${mission}','${stranger}','intrusion')`)).rejects.toThrow();
  });
  it("stores each participant's own check-in and starts only after both",async()=>{
    await asUser(requester,`insert into public.mission_presence(mission_id,user_id,arrived_at,consent_to_share) values('${mission}','${requester}',now(),false)`);
    await expect(asUser(helper,`update public.missions set status='in_progress' where id='${mission}'`)).rejects.toThrow(/Both neighbours/);
    await asUser(helper,`insert into public.mission_presence(mission_id,user_id,arrived_at,consent_to_share,reflection) values('${mission}','${helper}',now(),true,'We shared photos together.');update public.missions set status='in_progress' where id='${mission}'`);
  });
  it("atomically creates exactly one private Bloom when one person declines sharing",async()=>{
    await asUser(helper,`update public.missions set status='completed',completed_at=now() where id='${mission}'`);
    const result=await asUser(requester,`select story,consent_to_share from public.blooms where mission_id='${mission}'`);
    expect(result[0].rows).toEqual([{story:"We shared photos together.",consent_to_share:false}]);
    await expect(asUser(helper,`insert into public.blooms(mission_id,category,title,story,consent_to_share) values('${mission}','digital','Fake bloom','Fake story',true)`)).rejects.toThrow();
    await expect(asUser(helper,`update public.mission_presence set consent_to_share=true where mission_id='${mission}' and user_id='${requester}'`)).resolves.toBeDefined();
    await db.exec("reset role;set role anon;select set_config('request.jwt.claims','{}',false);");
    const publicRows=await db.query("select id from public.blooms");expect(publicRows.rows).toHaveLength(0);
  });
  it("enforces guest publishing and AI quotas",async()=>{
    for(let i=0;i<2;i++)await asUser(requester,`insert into public.missions(requester_id,title,original_request,summary,category,status,duration_minutes,location_label,scheduled_at) values('${requester}','Test request','Test request','Test request','skills','open',20,'Public community space',now())`);
    await expect(asUser(requester,`insert into public.missions(requester_id,title,original_request,summary,category,status,duration_minutes,location_label,scheduled_at) values('${requester}','Extra request','Extra request','Extra request','skills','open',20,'Public community space',now())`)).rejects.toThrow(/three requests/);
    for(let i=0;i<60;i++){const result=await asUser(helper,"select public.take_ai_quota() as allowed");expect(result[0].rows[0]).toEqual({allowed:true});}
    const denied=await asUser(helper,"select public.take_ai_quota() as allowed");expect(denied[0].rows[0]).toEqual({allowed:false});
  });
  it("shares only jointly-consented Blooms and rolls back completion if Bloom creation fails",async()=>{
    const result=await asUser(stranger,`insert into public.missions(requester_id,title,original_request,summary,category,status,duration_minutes,location_label,scheduled_at) values('${stranger}','Learn a recipe','Learn a recipe','Learn a recipe','food','open',30,'Public community space',now()) returning id`);
    const id=(result[0].rows[0] as {id:string}).id;
    await asUser(helper,`update public.missions set helper_id='${helper}',status='matched' where id='${id}';insert into public.mission_presence(mission_id,user_id,arrived_at,consent_to_share,reflection) values('${id}','${helper}',now(),true,'Force a rollback')`);
    await asUser(stranger,`insert into public.mission_presence(mission_id,user_id,arrived_at,consent_to_share) values('${id}','${stranger}',now(),true)`);
    await asUser(helper,`update public.missions set status='in_progress' where id='${id}'`);
    await admin("alter table public.blooms add constraint test_atomicity check(story <> 'Force a rollback')");
    await expect(asUser(helper,`update public.missions set status='completed',completed_at=now() where id='${id}'`)).rejects.toThrow();
    const unchanged=await asUser(helper,`select status from public.missions where id='${id}'`);expect(unchanged[0].rows[0]).toEqual({status:"in_progress"});
    await asUser(helper,`update public.mission_presence set reflection='A lovely recipe shared' where mission_id='${id}' and user_id='${helper}';update public.missions set status='completed',completed_at=now() where id='${id}'`);
    await db.exec("reset role;set role anon;select set_config('request.jwt.claims','{}',false);");
    const publicRows=await db.query("select consent_to_share,story from public.blooms");expect(publicRows.rows).toEqual([{consent_to_share:true,story:"A lovely recipe shared"}]);
  });
  it("cloud switch closes access for existing guest sessions and new signups",async()=>{
    await admin("update public.demo_settings set guest_enabled=false where id=true");
    const hidden=await asUser(requester,"select id from public.missions");expect(hidden[0].rows).toEqual([]);
    const denied=await asUser(helper,"select public.take_ai_quota() as allowed");expect(denied[0].rows[0]).toEqual({allowed:false});
    await expect(admin("insert into auth.users(id,is_anonymous) values(gen_random_uuid(),true)")).rejects.toThrow(/Guest event has ended/);
  });
});

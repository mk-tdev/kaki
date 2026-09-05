import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({identity:null as {sub:string;is_anonymous:boolean}|null, run:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/lib/auth/server",()=>({getIdentity:async()=>state.identity,requireIdentity:async()=>{if(!state.identity)throw new Error("Unauthorized");return state.identity;}}));
vi.mock("@/lib/db/pool",()=>({pool:()=>({query:state.run,connect:async()=>({query:state.run,release:()=>{}})})}));
import { createMission, listMissions, updateMission } from "@/data/missions";
import { getCurrentProfile, updateCurrentProfile } from "@/data/profile";
import { listMissionMessages, sendMissionMessage } from "@/data/messages";
import { listBlooms } from "@/data/blooms";
import { listNotifications, markNotificationsRead } from "@/data/notifications";
import { query } from "./query";
import { POST as presence } from "@/app/api/missions/[id]/presence/route";
import { GET as live } from "@/app/api/live/route";
const db=new PGlite();
const ids=["10000000-0000-4000-8000-000000000001","20000000-0000-4000-8000-000000000002","30000000-0000-4000-8000-000000000003"];
function as(index:number|null){state.identity=index===null?null:{sub:ids[index],is_anonymous:true};}
beforeAll(async()=>{
 for(const file of (await readdir("db/migrations")).filter(f=>f.endsWith(".sql")).sort())await db.exec(await readFile(`db/migrations/${file}`,"utf8"));
 await db.query("insert into auth.users(id,is_anonymous) select unnest($1::uuid[]),true",[ids]);
 await db.exec("set role kaki_app");
 state.run.mockImplementation(async(sql:string,values:unknown[]=[])=>{const r=await db.query(sql,values);return {...r,rowCount:r.affectedRows};});
},30000);
afterAll(async()=>{await db.close();});
describe("Azure repository using the restricted runtime login",()=>{
 let id:string;
 it("blocks direct table access and exposes only allowed profile columns",async()=>{
  await expect(db.query("select * from public.profiles")).rejects.toThrow();
  await expect(db.query("select * from auth.users")).rejects.toThrow();
  as(0);expect(await getCurrentProfile()).toMatchObject({id:ids[0],isGuest:true});
  expect(await updateCurrentProfile({fullName:"Neighbour One",role:"resident",preferredLanguage:"English"})).toMatchObject({name:"Neighbour One"});
 });
 it("runs parameterized joined reads and atomic claims without Supabase",async()=>{
  as(0);
  const m=await createMission({title:"Share photos",originalRequest:"Help me share photos",summary:"Share photos together",category:"digital",language:"English",durationMinutes:20,location:"Pek Kio community space",scheduledAt:new Date().toISOString(),guide:["Meet","Share","Thank"],safetyLevel:"community"});
  id=m.id; expect(m.requester.name).toBe("Neighbour One");expect(m.guide).toEqual(["Meet","Share","Thank"]);
  as(1);expect((await listMissions()).map(m=>m.id)).toContain(id);await updateMission(id,"claim");
  as(2);expect(await listMissions()).toEqual([]);await expect(updateMission(id,"claim")).rejects.toThrow();
 });
 it("isolates private messages and rolls back failed completion",async()=>{
  as(1);const m=await sendMissionMessage(id,"Hi! Let's meet in the public space.");expect(m.sender.id).toBe(ids[1]);
  as(0);expect(await listMissionMessages(id)).toHaveLength(1);
  as(2);expect(await listMissionMessages(id)).toHaveLength(0);await expect(sendMissionMessage(id,"intrusion")).rejects.toThrow();
  as(1);await expect(updateMission(id,"start")).rejects.toThrow(/Both neighbours/);
 });
 it("preserves check-ins and consent during partial upserts, then publishes a Bloom",async()=>{
  for(const user of [0,1]) {
   as(user);
   const post=(body:unknown)=>presence(new Request("http://localhost/api/presence",{method:"POST",body:JSON.stringify(body)}),{params:Promise.resolve({id})});
   expect((await post({action:"consent",consentToShare:true})).status).toBe(200);
   expect((await post({action:"check_in"})).status).toBe(200);
  }
  as(1);await updateMission(id,"start");await updateMission(id,"complete","We shared family photos together.",true);
  expect(await listBlooms()).toHaveLength(1);
  as(0);const notices=await listNotifications();expect(notices.length).toBeGreaterThan(0);await markNotificationsRead();expect((await listNotifications()).every(n=>n.readAt)).toBe(true);
  as(null);const response=await live();expect(response.status).toBe(200);expect(await response.json()).toMatchObject({total:1});
 });
 it("clears transaction identity after both successful and failed queries",async()=>{
  const role=await db.query<{current_user:string}>("select current_user");expect(role.rows[0].current_user).toBe("kaki_app");
  expect((await db.query<{claims:string}>("select current_setting('request.jwt.claims',true) as claims")).rows[0].claims).toBe("");
  as(0);await expect(query("select * from auth.users")).rejects.toThrow();
  expect((await db.query<{current_user:string}>("select current_user")).rows[0].current_user).toBe("kaki_app");
 });
 it("resolves opaque sessions, revokes them, and denies expired sessions",async()=>{
  await db.query("select auth.issue_session($1,$2)",["a".repeat(64),ids[0]]);
  expect((await db.query("select * from auth.resolve_session($1)",["a".repeat(64)])).rows).toHaveLength(1);
  await db.query("select auth.revoke_session($1)",["a".repeat(64)]);
  expect((await db.query("select * from auth.resolve_session($1)",["a".repeat(64)])).rows).toHaveLength(0);
  await db.exec("reset role; insert into auth.sessions values('expired','10000000-0000-4000-8000-000000000001',now()-interval '1 second',now());set role kaki_app");
  expect((await db.query("select * from auth.resolve_session('expired')")).rows).toHaveLength(0);
  await db.query("select auth.issue_session($1,$2)",["b".repeat(64),ids[0]]);
  await db.exec("reset role;update public.demo_settings set guest_enabled=false where id=true;set role kaki_app");
  expect((await db.query("select * from auth.resolve_session($1)",["b".repeat(64)])).rows).toHaveLength(0);
  await expect(db.query("select auth.register(null,null,null,true)")).rejects.toThrow(/Guest event has ended/);
 });
});

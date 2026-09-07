import { Injectable } from "@nestjs/common";
import { lookup } from "node:dns/promises";
import { pool } from "./lib/db/pool.js";
import { getIdentity } from "./lib/auth/server.js";
import { guestModeEnabled } from "./lib/guest-mode.js";
import * as missions from "./app/api/missions/route.js";
import * as mission from "./app/api/missions/[id]/route.js";
import * as messages from "./app/api/missions/[id]/messages/route.js";
import * as presence from "./app/api/missions/[id]/presence/route.js";
import * as match from "./app/api/missions/[id]/match/route.js";
import * as profile from "./app/api/profile/route.js";
import * as blooms from "./app/api/blooms/route.js";
import * as live from "./app/api/live/route.js";
import * as notifications from "./app/api/notifications/route.js";
import * as aiMission from "./app/api/ai/mission/route.js";
import * as suggestions from "./app/api/ai/suggestions/route.js";
import * as translate from "./app/api/ai/translate/route.js";
import * as transcribe from "./app/api/ai/transcribe/route.js";
import { handleAuth } from "./lib/auth/handler.js";
type Handler=(request:Request,context:{params:Promise<{id:string}>})=>Promise<Response>;
type Routes=Record<string,Partial<Record<string,Handler>>>;
const routes:Routes={
 '/api/missions':missions,'/api/missions/:id':mission,
 '/api/missions/:id/messages':messages,'/api/missions/:id/presence':presence,'/api/missions/:id/match':match,
 '/api/profile':profile,'/api/blooms':blooms,'/api/live':live,'/api/notifications':notifications,
 '/api/ai/mission':aiMission,'/api/ai/suggestions':suggestions,'/api/ai/translate':translate,'/api/ai/transcribe':transcribe,
};
@Injectable()
export class ApiService {
 async dispatch(request:Request):Promise<Response> {
  const path=new URL(request.url).pathname;
  if(path==='/api/health' && request.method==='GET') {
   await pool().query('select 1');
   const hostname=new URL(process.env.DATABASE_URL!).hostname;
   const {address}=await lookup(hostname);
   return Response.json({ok:true,database:'connected',databaseAddress:address});
  }
  if(path==='/api/capabilities' && request.method==='GET')return Response.json({aiConfigured:Boolean(process.env.OPENAI_API_KEY),missionModel:process.env.OPENAI_MODEL || 'gpt-5-mini',suggestionsModel:process.env.OPENAI_SUGGESTIONS_MODEL || 'gpt-4.1-nano'});
  if(path==='/api/session' && request.method==='GET')return Response.json({identity:await getIdentity()});
  if(path==='/api/guest-mode' && request.method==='GET')return Response.json({enabled:await guestModeEnabled()});
  if(path.startsWith('/api/auth/') && request.method==='POST')return handleAuth(request,path.slice('/api/auth/'.length));
  let id='';
  const key=path.replace(/^(\/api\/missions)\/([^/]+)/,(_match,prefix,value)=>{id=value;return `${prefix}/:id`;});
  if(id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return Response.json({error:'Invalid mission ID'},{status:400});
  const handlers=routes[key];
  if(!handlers)return Response.json({error:'Not found'},{status:404});
  const handler=handlers[request.method];
  if(!handler)return Response.json({error:'Method not allowed'},{status:405,headers:{Allow:Object.keys(handlers).join(', ')}});
  return handler(request,{params:Promise.resolve({id})});
 }
}

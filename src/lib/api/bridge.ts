import 'server-only';
import { NextResponse } from 'next/server';
import { apiConfig, sessionCookie } from './config';
import { isSameOrigin } from '@/lib/auth/origin';
import { limitedBody } from '@/lib/ai/language';
const browserPaths=/^\/api\/(?:profile|notifications|blooms|live|missions(?:\/[0-9a-f-]+(?:\/(?:messages|presence|match))?)?|ai\/(?:mission|suggestions|translate|transcribe)|auth\/(?:guest|login|logout|register))$/i;
export async function forward(request:Request) {
 const path=new URL(request.url).pathname;
 if(!browserPaths.test(path))return NextResponse.json({error:'Not found'},{status:404});
 if(!['GET','HEAD'].includes(request.method) && !isSameOrigin(request))return NextResponse.json({error:'Open KAKI to make this change.'},{status:403});
 try {
  const {base,key}=apiConfig();
  // Construct every forwarded header ourselves: never trust browser bridge/session/IP headers.
  const headers=new Headers({'x-kaki-bridge-key':key});
  const cookie=(request.headers.get('cookie') || '').split(';').map(s=>s.trim()).find(s=>s.startsWith(`${sessionCookie()}=`));
  const token=cookie?.slice(sessionCookie().length+1);
  if(token && /^[a-f0-9]{64}$/.test(token))headers.set('x-kaki-session',token);
  headers.set('x-kaki-client-ip',process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for') || 'unknown' : 'local');
  const type=request.headers.get('content-type');if(type)headers.set('content-type',type);
  const signal=AbortSignal.any([request.signal,AbortSignal.timeout(55_000)]);
  const body=['GET','HEAD'].includes(request.method)?undefined:await limitedBody(request,path==='/api/ai/transcribe'?3_016_384:16_000);
  const upstream=await fetch(`${base}${path}`,{method:request.method,headers,body,signal,cache:'no-store',redirect:'error'});
  const response=new NextResponse(upstream.body,{status:upstream.status,headers:{'Content-Type':upstream.headers.get('content-type') || 'application/json','Cache-Control':'no-store'}});
  const newToken=upstream.headers.get('x-kaki-session-token');
  if(newToken==='revoke')response.cookies.set(sessionCookie(),'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
  else if(newToken && /^[a-f0-9]{64}$/.test(newToken))response.cookies.set(sessionCookie(),newToken,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:7*86400});
  return response;
 } catch(error) {
  const oversized=error instanceof Error && error.message==='Payload too large';
  return NextResponse.json({error:oversized?'Payload too large':'KAKI could not reach the API. Please try again.'},{status:oversized?413:502});
 }
}

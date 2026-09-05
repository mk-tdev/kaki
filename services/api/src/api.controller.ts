import { All, Controller, Get, Req, Res } from "@nestjs/common";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";
import { timingSafeEqual, createHash } from "node:crypto";
import { ApiService } from "./api.service";
import { authContext, type AuthContext } from "./lib/auth/server";
const digest=(value:string)=>createHash('sha256').update(value).digest();
export function validBridgeKey(value:string|undefined) {
 const expected=process.env.API_BRIDGE_KEY;
 return Boolean(expected && value && timingSafeEqual(digest(expected),digest(value)));
}
@Controller()
export class ApiController {
 constructor(private readonly api:ApiService) {}
 @Get('health') health(){return {ok:true,service:'kaki-api'};}
 @All('api/*path')
 async handle(@Req() req:ExpressRequest,@Res() res:ExpressResponse) {
  res.setHeader('Cache-Control','no-store');
  if(!validBridgeKey(req.get('x-kaki-bridge-key')))return res.status(401).json({error:'Unauthorized bridge'});
  const abort=new AbortController();
  req.on('aborted',()=>abort.abort());
  res.on('close',()=>{if(!res.writableEnded)abort.abort();});
  const headers=new Headers();
  for(const name of ['content-type','content-length','x-kaki-client-ip']) {
   const value=req.get(name);if(value)headers.set(name,value);
  }
  const context:AuthContext={token:req.get('x-kaki-session')};
  try {
   // Body parsing is disabled globally so audio multipart bytes remain unchanged.
   const chunks:Buffer[]=[];let size=0;
   for await(const chunk of req){
    const bytes=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
    size+=bytes.length;
    if(size>3_016_384)return res.status(413).json({error:'Payload too large'});
    chunks.push(bytes);
   }
   const webRequest=new Request(`http://kaki-api${req.originalUrl}`,{
    method:req.method,headers,signal:abort.signal,
    ...(!['GET','HEAD'].includes(req.method)?{body:new Uint8Array(Buffer.concat(chunks))}:{}),
   });
   const response=await authContext.run(context,()=>this.api.dispatch(webRequest));
   // This private response header is consumed by Next.js, never exposed to browsers.
   if(context.issuedToken !== undefined)res.setHeader('x-kaki-session-token',context.issuedToken || 'revoke');
   const type=response.headers.get('content-type');if(type)res.setHeader('Content-Type',type);
   const allow=response.headers.get('allow');if(allow)res.setHeader('Allow',allow);
   return res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch(error) {
   console.error('API request failed',error instanceof Error?error.name:'Unknown error');
   if(!res.headersSent)return res.status(503).json({error:'Service unavailable. Please try again.'});
  }
 }
}

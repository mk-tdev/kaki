import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { pool } from "@/lib/db/pool";
import { getIdentity, issueSession, revokeSession } from "./server";
import { hashPassword, verifyPassword, tokenHash } from "./password";
import { isSameOrigin } from "./origin";
const credentials = z.object({email:z.string().email().max(254).transform(s=>s.toLowerCase()),password:z.string().min(8).max(128)});
const registration = credentials.extend({fullName:z.string().trim().min(2).max(80),inviteCode:z.string().max(200)});
const json = (body: unknown, status = 200) => NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
async function allowed(bucket: string, limit: number) {
  const result=await pool().query<{allowed:boolean}>("select auth.take_rate_limit($1,$2) as allowed",[bucket,limit]);
  return result.rows[0].allowed;
}
export async function handleAuth(request: Request, action: string) {
  if (!isSameOrigin(request)) return json({error:"Open KAKI to sign in."},403);
  try {
    if (action === "logout") { await revokeSession(); return json({ok:true}); }
    if (action === "guest" && await getIdentity()) return json({ok:true});
    // Vercel overwrites this header. Do not trust arbitrary X-Forwarded-For locally.
    const network = process.env.VERCEL ? request.headers.get("x-vercel-forwarded-for") || "unknown" : "local";
    if (!await allowed(`network:${tokenHash(network)}`,300) || !await allowed("auth-global",2000)) return json({error:"Too many attempts. Try again later."},429);
    if (action === "guest") {
      const result = await pool().query<{id:string}>("select auth.register(null,null,null,true) as id");
      await issueSession(result.rows[0].id);
      return json({ok:true});
    }
    // Bound actual bytes; Content-Length alone is untrusted.
    const reader=request.body?.getReader();
    if (!reader) return json({error:"Missing details."},400);
    let bytes=0; const chunks: Uint8Array[]=[];
    while (true) { const {done,value}=await reader.read(); if(done)break; bytes+=value.length; if(bytes>4096){await reader.cancel();return json({error:"Details too long."},413);} chunks.push(value); }
    const body=JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (action === "register") {
      const parsed=registration.safeParse(body);
      if (!parsed.success) return json({error:"Enter a valid name, email and password (8–128 characters)."},400);
      const expected=process.env.AUTH_INVITE_CODE;
      const supplied=parsed.data.inviteCode;
      if (!expected || !timingSafeEqual(Buffer.from(tokenHash(expected)),Buffer.from(tokenHash(supplied)))) return json({error:"Ask the organiser for a valid invitation code."},403);
      if (!await allowed("registrations",100)) return json({error:"Account registration is busy. Try later."},429);
      const password=await hashPassword(parsed.data.password);
      const result=await pool().query<{id:string}>("select auth.register($1,$2,$3,false) as id",[parsed.data.email,password,parsed.data.fullName]);
      await issueSession(result.rows[0].id);
      return json({ok:true});
    }
    if (action === "login") {
      const parsed=credentials.safeParse(body);
      if (!parsed.success) return json({error:"Invalid email or password."},400);
      if (!await allowed(`login:${tokenHash(parsed.data.email)}`,20)) return json({error:"Too many attempts. Try again later."},429);
      const result=await pool().query<{id:string;password_hash:string}>("select * from auth.account($1)",[parsed.data.email]);
      const account=result.rows[0];
      // Equal password work even for an unknown account.
      const fallback=`scrypt$00000000000000000000000000000000$${"00".repeat(64)}`;
      const valid=await verifyPassword(parsed.data.password,account?.password_hash || fallback);
      if (!account || !valid) return json({error:"Invalid email or password."},401);
      await revokeSession();
      await issueSession(account.id);
      return json({ok:true});
    }
    return json({error:"Unknown authentication action."},404);
  } catch {
    return json({error:action === "guest" ? "Guest entry is unavailable. Ask the organiser to enable it." : "Could not sign in or create this account. Check your details and try again."},400);
  }
}

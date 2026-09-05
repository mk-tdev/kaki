import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { pool } from "../db/pool";
import { tokenHash } from "./password";
export type Identity = { sub: string; is_anonymous: boolean };
export type AuthContext = { token?: string; identity?: Promise<Identity|null>; issuedToken?: string };
export const authContext = new AsyncLocalStorage<AuthContext>();
function context() {
 const value=authContext.getStore();
 if (!value) throw new Error("Missing request context");
 return value;
}
export function getIdentity(): Promise<Identity|null> {
 const current=context();
 return current.identity ??= (async()=>{
  if (!current.token || !/^[a-f0-9]{64}$/.test(current.token))return null;
  const result=await pool().query<Identity>("select * from auth.resolve_session($1)",[tokenHash(current.token)]);
  return result.rows[0] ?? null;
 })();
}
export async function requireIdentity() {
 const identity=await getIdentity();
 if(!identity)throw new Error("Unauthorized");
 return identity;
}
export async function issueSession(userId:string) {
 const token=randomBytes(32).toString("hex");
 await pool().query("select auth.issue_session($1,$2)",[tokenHash(token),userId]);
 const current=context();current.token=token;current.issuedToken=token;current.identity=undefined;
}
export async function revokeSession() {
 const current=context();
 if(current.token)await pool().query("select auth.revoke_session($1)",[tokenHash(current.token)]);
 current.token=undefined;current.identity=Promise.resolve(null);current.issuedToken="";
}
export async function createClient() {
 return {auth:{getClaims:async()=>({data:{claims:await getIdentity()},error:null})}};
}

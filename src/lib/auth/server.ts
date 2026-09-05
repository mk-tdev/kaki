import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { pool } from "@/lib/db/pool";
import { tokenHash } from "./password";
export type Identity = { sub: string; is_anonymous: boolean };
export const sessionCookie = process.env.NODE_ENV === "production" ? "__Host-kaki-session" : "kaki-session";
export const getIdentity = cache(async (): Promise<Identity | null> => {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await pool().query<Identity>("select * from auth.resolve_session($1)", [tokenHash(token)]);
  return result.rows[0] ?? null;
});
export async function requireIdentity() {
  const identity = await getIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity;
}
export async function issueSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  await pool().query("select auth.issue_session($1,$2)", [tokenHash(token), userId]);
  (await cookies()).set(sessionCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 86400 });
}
export async function revokeSession() {
  const store = await cookies();
  const token = store.get(sessionCookie)?.value;
  if (token) await pool().query("select auth.revoke_session($1)", [tokenHash(token)]);
  store.delete(sessionCookie);
}
// Small auth facade while existing AI routes retain their response contracts.
export async function createClient() {
  return { auth: { getClaims: async () => ({ data: { claims: await getIdentity() }, error: null }) } };
}

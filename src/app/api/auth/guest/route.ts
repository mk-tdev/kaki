import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { guestModeEnabled } from "@/lib/guest-mode";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return NextResponse.json({ error: "Open KAKI to join." }, { status: 403 });
  if (!await guestModeEnabled()) return NextResponse.json({ error: "Guest access is not currently enabled." }, { status: 403 });
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  // Create the session in the browser, so Supabase's signup IP rate limit is
  // applied to the visitor's network rather than a shared Vercel egress IP.
  return NextResponse.json({ ok: true, signedIn: Boolean(claims?.claims?.sub) }, { headers: { "Cache-Control": "no-store" } });
}

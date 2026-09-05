import { NextResponse } from "next/server";
// Legacy confirmation URLs never establish an Azure session.
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login",request.url));
}

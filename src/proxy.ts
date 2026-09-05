import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/auth/origin";
export function proxy(request: NextRequest) {
  if (!["GET","HEAD","OPTIONS"].includes(request.method) && !isSameOrigin(request)) {
    return NextResponse.json({error:"Open KAKI to make this change."},{status:403});
  }
  return NextResponse.next();
}
export const config = { matcher: "/api/:path*" };

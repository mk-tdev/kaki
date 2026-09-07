import { handleAuth } from "../../../../lib/auth/handler.js";
export async function POST(request: Request) { return handleAuth(request,"guest"); }

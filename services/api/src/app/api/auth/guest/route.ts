import { handleAuth } from "../../../../lib/auth/handler";
export async function POST(request: Request) { return handleAuth(request,"guest"); }

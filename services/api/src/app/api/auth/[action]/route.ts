import { handleAuth } from "../../../../lib/auth/handler.js";
export async function POST(request: Request, {params}: {params:Promise<{action:string}>}) {
  return handleAuth(request,(await params).action);
}

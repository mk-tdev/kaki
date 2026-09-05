import { handleAuth } from "../../../../lib/auth/handler";
export async function POST(request: Request, {params}: {params:Promise<{action:string}>}) {
  return handleAuth(request,(await params).action);
}

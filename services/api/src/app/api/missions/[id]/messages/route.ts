import { z } from "zod";
import { listMissionMessages, sendMissionMessage } from "../../../../../data/messages";

const messageSchema = z.object({ body: z.string().trim().min(1).max(1200) });

function failure(error: unknown) {
  const unauthorized = error instanceof Error && error.message === "Unauthorized";
  return Response.json({ error: unauthorized ? "Unauthorized" : "Could not access mission messages." }, { status: unauthorized ? 401 : 500 });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return Response.json({ messages: await listMissionMessages(id) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = messageSchema.safeParse(await request.json());
    if (!payload.success) return Response.json({ error: "Write a message before sending." }, { status: 400 });
    const { id } = await params;
    return Response.json({ message: await sendMissionMessage(id, payload.data.body) }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}

import { z } from "zod";
import { listNotifications, markNotificationsRead } from "../../../data/notifications";

const updateSchema = z.object({ ids: z.array(z.string().uuid()).max(50).optional() });

function statusFor(error: unknown) {
  return error instanceof Error && error.message === "Unauthorized" ? 401 : 500;
}

export async function GET() {
  try {
    return Response.json({ notifications: await listNotifications() });
  } catch (error) {
    return Response.json({ error: "Could not load notifications." }, { status: statusFor(error) });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = updateSchema.safeParse(await request.json());
    if (!payload.success) return Response.json({ error: "Invalid notification selection." }, { status: 400 });
    await markNotificationsRead(payload.data.ids);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Could not update notifications." }, { status: statusFor(error) });
  }
}

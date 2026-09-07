import { z } from "zod";
import { getCurrentProfile, updateCurrentProfile } from "../../../data/profile.js";

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  role: z.enum(["resident", "helper"]),
  preferredLanguage: z.string().trim().min(2).max(80),
  skills: z.array(z.string().trim().min(2).max(60)).max(8).optional(),
});

function errorResponse(error: unknown, fallback: string) {
  const unauthorized = error instanceof Error && error.message === "Unauthorized";
  return Response.json(
    { error: unauthorized ? "Unauthorized" : fallback },
    { status: unauthorized ? 401 : 500 },
  );
}

export async function GET() {
  try {
    return Response.json({ profile: await getCurrentProfile() });
  } catch (error) {
    return errorResponse(error, "Could not load your profile.");
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = profileUpdateSchema.safeParse(await request.json());
    if (!payload.success) return Response.json({ error: "Check your profile details." }, { status: 400 });
    return Response.json({ profile: await updateCurrentProfile(payload.data) });
  } catch (error) {
    return errorResponse(error, "Could not save your profile.");
  }
}

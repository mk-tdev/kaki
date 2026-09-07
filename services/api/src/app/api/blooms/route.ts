import { listBlooms } from "../../../data/blooms.js";

export async function GET() {
  try {
    return Response.json({ blooms: await listBlooms() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return Response.json({ error: unauthorized ? "Unauthorized" : "Could not load community blooms." }, { status: unauthorized ? 401 : 500 });
  }
}

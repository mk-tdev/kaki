import { NextResponse } from "next/server";
import { listBlooms } from "@/data/blooms";

export async function GET() {
  try {
    return NextResponse.json({ blooms: await listBlooms() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json({ error: unauthorized ? "Unauthorized" : "Could not load community blooms." }, { status: unauthorized ? 401 : 500 });
  }
}

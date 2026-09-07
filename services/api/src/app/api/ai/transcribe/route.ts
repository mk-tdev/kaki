import { OpenAI } from "openai";
import { createClient } from "../../../../lib/auth/server.js";
import { takeAiQuota } from "../../../../lib/ai/quota.js";
import { audioTypes, limitedBody, MAX_AUDIO_BYTES } from "../../../../lib/ai/language.js";

export async function POST(request: Request) {
  try {
    const authClient = await createClient();
    const { data, error } = await authClient.auth.getClaims();
    if (error || !data?.claims?.sub) return Response.json({error:"Please refresh to rejoin KAKI."},{status:401});
    if (!process.env.OPENAI_API_KEY) return Response.json({error:"Voice input is not configured. You can still type."},{status:503});
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return Response.json({error:"Send a microphone recording."},{status:415});
    const bytes = await limitedBody(request, MAX_AUDIO_BYTES + 16384);
    const form = await new Request(request.url, {method:"POST", headers:{"content-type":request.headers.get("content-type") ?? ""}, body:bytes}).formData();
    const audio = form.get("audio");
    if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES) return Response.json({error:"Record a short voice message (up to 3 MB)."},{status:400});
    const extension = audioTypes[audio.type.split(";")[0]];
    if (!extension) return Response.json({error:"This recording format is not supported. Please type your request."},{status:415});
    if (!await takeAiQuota()) return Response.json({error:"AI limit reached. Please try later or type your request."},{status:429});
    const client = new OpenAI({timeout:20000,maxRetries:0});
    const result = await client.audio.transcriptions.create({
      model:process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-transcribe",
      file:new File([audio], `request.${extension}`, {type:audio.type}),
    },{signal:request.signal});
    const text = result.text.trim();
    if (!text || text.length > 1000) return Response.json({error:"Please try a shorter, clearer recording (up to 1,000 characters)."}, {status:422});
    return Response.json({text,mode:"openai"},{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    return Response.json({error:error instanceof Error && error.message === "Payload too large" ? "Recording too large. Please keep it under 45 seconds." : "Could not transcribe just now. Try again or type your request."},{status:error instanceof Error && error.message === "Payload too large" ? 413 : 502});
  }
}

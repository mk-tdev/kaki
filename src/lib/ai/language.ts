export const supportedLanguages = ["English", "中文", "Bahasa Melayu", "தமிழ்"] as const;
export const languageOptions = supportedLanguages.map(value => ({ value, label: value }));
export const MAX_AUDIO_BYTES = 3_000_000;
export const audioTypes: Record<string, string> = {
  "audio/webm": "webm", "audio/mp4": "mp4", "audio/mpeg": "mp3",
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/m4a": "m4a",
};

export async function limitedBody(request: Request, max: number) {
  if (Number(request.headers.get("content-length")) > max) throw new Error("Payload too large");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > max) { await reader.cancel(); throw new Error("Payload too large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

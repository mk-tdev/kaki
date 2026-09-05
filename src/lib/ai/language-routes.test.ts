import { beforeEach, expect, it, vi } from "vitest";
import { POST as transcribe } from "@/app/api/ai/transcribe/route";
import { POST as translate } from "@/app/api/ai/translate/route";
const mocks=vi.hoisted(()=>({claims:vi.fn(),quota:vi.fn(),audio:vi.fn(),text:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({auth:{getClaims:mocks.claims}})}));
vi.mock("@/lib/ai/quota",()=>({takeAiQuota:mocks.quota}));
vi.mock("openai",()=>({default:class { audio={transcriptions:{create:mocks.audio}};responses={create:mocks.text}; }}));
beforeEach(()=>{
  vi.clearAllMocks();vi.stubEnv("OPENAI_API_KEY","test-only");
  mocks.claims.mockResolvedValue({data:{claims:{sub:"test-user"}}});mocks.quota.mockResolvedValue(true);
  mocks.audio.mockResolvedValue({text:"Could you help with photos?"});mocks.text.mockResolvedValue({output_text:"请帮我发照片。"});
});
function audioRequest(type="audio/webm",size=50){
  const form=new FormData();form.append("audio",new File([new Uint8Array(size)],"request.webm",{type}));
  return new Request("http://localhost:5026/api/ai/transcribe",{method:"POST",body:form});
}
it("transcribes authenticated recordings without persisting them",async()=>{
  const response=await transcribe(audioRequest());expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({text:"Could you help with photos?",mode:"openai"});
  expect(mocks.audio).toHaveBeenCalledTimes(1);expect(response.headers.get("cache-control")).toBe("no-store");
});
it("rejects unsupported and oversized audio before calling OpenAI",async()=>{
  expect((await transcribe(audioRequest("text/plain"))).status).toBe(415);
  expect((await transcribe(new Request("http://localhost:5026/api/ai/transcribe",{method:"POST",headers:{"content-length":"3020000","content-type":"multipart/form-data; boundary=test"},body:"too big"}))).status).toBe(413);
  expect(mocks.audio).not.toHaveBeenCalled();expect(mocks.quota).not.toHaveBeenCalled();
});
it("enforces authentication and shared quota for audio",async()=>{
  mocks.claims.mockResolvedValueOnce({data:null});
  expect((await transcribe(audioRequest())).status).toBe(401);
  mocks.quota.mockResolvedValue(false);
  expect((await transcribe(audioRequest())).status).toBe(429);
  expect(mocks.audio).not.toHaveBeenCalled();
});
it("translates only valid supported language requests",async()=>{
  const request=(language:string)=>new Request("http://localhost:5026/api/ai/translate",{method:"POST",body:JSON.stringify({text:"Help me send a photo",language})});
  expect((await translate(request("unsupported"))).status).toBe(400);
  const response=await translate(request("中文"));expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({text:"请帮我发照片。",language:"中文"});
  expect(mocks.text.mock.calls[0][0]).toMatchObject({store:false,input:"Help me send a photo"});
});
it("does not return a fake transcript when OpenAI fails",async()=>{
  mocks.audio.mockRejectedValue(new Error("upstream failure"));
  expect((await transcribe(audioRequest())).status).toBe(502);
});

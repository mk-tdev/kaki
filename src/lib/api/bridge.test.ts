import { beforeEach, afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only',()=>({}));
import { forward } from './bridge';
const upstream=vi.fn();
beforeEach(()=>{
 vi.stubEnv('API_BASE_URL','https://api.example.test');vi.stubEnv('API_BRIDGE_KEY','server-secret');vi.stubEnv('APP_ORIGIN','http://localhost:5027');vi.stubEnv('NODE_ENV','test');vi.stubEnv('VERCEL','');
 vi.stubGlobal('fetch',upstream);upstream.mockReset();
});
afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});
it('forwards only the validated cookie and server key, hiding internal session headers',async()=>{
 upstream.mockResolvedValue(new Response('{"ok":true}',{headers:{'content-type':'application/json','x-kaki-session-token':'b'.repeat(64)}}));
 const response=await forward(new Request('http://localhost:5027/api/auth/login',{method:'POST',headers:{origin:'http://localhost:5027','content-type':'application/json',cookie:`kaki-session=${'a'.repeat(64)}`,'x-kaki-session':'forged','x-kaki-bridge-key':'forged','x-kaki-client-ip':'forged'},body:'{}'}));
 expect(response.status).toBe(200);
 const [url,options]=upstream.mock.calls[0];expect(url).toBe('https://api.example.test/api/auth/login');
 expect(options.headers.get('x-kaki-session')).toBe('a'.repeat(64));expect(options.headers.get('x-kaki-bridge-key')).toBe('server-secret');expect(options.headers.get('x-kaki-client-ip')).toBe('local');
 expect(response.headers.get('x-kaki-session-token')).toBeNull();expect(response.headers.get('set-cookie')).toContain('HttpOnly');
});
it('blocks cross-origin writes and backend-only operational endpoints',async()=>{
 expect((await forward(new Request('http://localhost:5027/api/auth/guest',{method:'POST',headers:{origin:'https://attacker.example'}}))).status).toBe(403);
 expect((await forward(new Request('http://localhost:5027/api/health'))).status).toBe(404);
 expect(upstream).not.toHaveBeenCalled();
});
it('preserves multipart audio bytes and upstream errors',async()=>{
 const form=new FormData();form.append('audio',new File(['audio-bytes'],'clip.webm',{type:'audio/webm'}));
 const request=new Request('http://localhost:5027/api/ai/transcribe',{method:'POST',headers:{origin:'http://localhost:5027'},body:form});
 const expected=await request.clone().text();
 upstream.mockResolvedValue(Response.json({error:'AI limit reached'},{status:429}));
 const response=await forward(request);
 expect(response.status).toBe(429);expect(new TextDecoder().decode(upstream.mock.calls[0][1].body)).toBe(expected);
});
it('rejects oversized writes before opening the API connection',async()=>{
 const response=await forward(new Request('http://localhost:5027/api/profile',{method:'PATCH',headers:{origin:'http://localhost:5027'},body:'x'.repeat(16001)}));
 expect(response.status).toBe(413);expect(upstream).not.toHaveBeenCalled();
});

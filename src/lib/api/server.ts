import 'server-only';
import { cookies } from 'next/headers';
import { apiConfig, sessionCookie } from './config';
export async function apiGet<T>(path:string):Promise<T> {
 const {base,key}=apiConfig();
 const token=(await cookies()).get(sessionCookie())?.value;
 const response=await fetch(`${base}${path}`,{headers:{'x-kaki-bridge-key':key,...(token?{'x-kaki-session':token}:{})},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20_000)});
 if(response.status===401)throw new Error('Unauthorized');
 if(!response.ok)throw new Error('The KAKI API is temporarily unavailable.');
 return response.json() as Promise<T>;
}

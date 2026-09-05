export function apiConfig() {
 const base=process.env.API_BASE_URL;
 const key=process.env.API_BRIDGE_KEY;
 if(!base || !key)throw new Error('API_BASE_URL and API_BRIDGE_KEY are required');
 const url=new URL(base);
 if(url.username || url.password || url.search || url.hash || url.pathname !== '/')throw new Error('API_BASE_URL must be an origin');
 const local=['localhost','127.0.0.1'].includes(url.hostname);
 if(url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && local && url.protocol === 'http:'))throw new Error('The API requires HTTPS');
 return {base:url.origin,key};
}
export const sessionCookie=()=>process.env.NODE_ENV==='production'?'__Host-kaki-session':'kaki-session';

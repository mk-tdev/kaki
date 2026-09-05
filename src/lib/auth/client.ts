"use client";
async function call(action: string, body?: unknown) {
  try {
    const response=await fetch(`/api/auth/${action}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body ?? {})});
    const payload=await response.json();
    return {data:{session:response.ok},error:response.ok ? null : new Error(payload.error || "Could not sign in.")};
  } catch { return {data:{session:false},error:new Error("Connection interrupted. Please try again.")}; }
}
export function createClient() {
  return {auth:{
    signInWithPassword:(credentials:{email:string;password:string})=>call("login",credentials),
    signUp:(input:{email:string;password:string;inviteCode:string;options:{emailRedirectTo:string;data:{full_name:string;preferred_language:string}}})=>call("register",{email:input.email,password:input.password,fullName:input.options.data.full_name,inviteCode:input.inviteCode}),
    signOut:()=>call("logout"),
  }};
}

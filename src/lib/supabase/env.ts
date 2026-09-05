export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) throw new Error("Supabase Cloud environment is not configured.");

  const hostname = new URL(url).hostname;
  if (!url.startsWith("https://") || !hostname.endsWith(".supabase.co")) {
    throw new Error("KAKI requires a hosted Supabase Cloud project URL.");
  }

  return { url, publishableKey };
}

export function hasSupabaseEnv() {
  try {
    getSupabaseEnv();
    return true;
  } catch {
    return false;
  }
}

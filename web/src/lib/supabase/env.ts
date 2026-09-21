/** True when public Supabase env looks like a real project (not placeholders). */
export function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return false;
  if (url.includes("your-project") || url.includes("example.supabase")) return false;
  if (key.includes("your-anon") || key.includes("placeholder")) return false;
  return url.startsWith("https://");
}

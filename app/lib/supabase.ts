import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validasi environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[SUPABASE] Missing environment variables:",
    !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : "",
    !supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : "",
  );
}

// Create Supabase client dengan options untuk reliability
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Add timeout & retry logic
  global: {
    headers: {
      "X-Client-Info": "tk-tadika/1.0",
    },
  },
});

// Wrapper untuk query dengan timeout
export const supabaseWithTimeout = async <T>(
  query: Promise<{ data: T | null; error: unknown }>,
  timeoutMs: number = 10000,
): Promise<{ data: T | null; error: unknown }> => {
  return Promise.race([
    query,
    new Promise<{ data: null; error: Error }>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error(`Supabase query timeout setelah ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
};
// Ini harus tidak kosong!
console.log("Supabase URL:", supabaseUrl ? "✓ Set" : "✗ Missing");
console.log("Supabase Key:", supabaseAnonKey ? "✓ Set" : "✗ Missing");

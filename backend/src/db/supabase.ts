import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import type { Database } from "./types.js";

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (!adminClient) {
    adminClient = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  return adminClient;
}

export async function checkSupabaseConnection(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error && !isMissingTableError(error.message)) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: error.message,
      };
    }

    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function isMissingTableError(message: string) {
  return (
    message.includes("does not exist") ||
    message.includes("Could not find the table")
  );
}

export function assertNoError(
  error: { message: string } | null,
  fallback = "Database operation failed",
) {
  if (error) {
    throw new Error(error.message || fallback);
  }
}

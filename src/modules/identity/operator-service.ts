import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Permission } from "./roles";
import { AuthorizationError, type StaffContext } from "./authorization";
import { requirePermission } from "./require-permission";
import { runAuthorizedOperation } from "./privileged-operation";

function createPrivilegedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new AuthorizationError("UNAVAILABLE");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

// Trusted domain modules only. The callback MUST scope reads/writes to context.operatorId.
// This is not a Server Action, HTTP endpoint, transaction wrapper or unrestricted CRUD API.
export async function withOperatorService<Result>(
  operatorId: string, permission: Permission,
  operation: (client: SupabaseClient, context: StaffContext) => Promise<Result>,
): Promise<Result> {
  return runAuthorizedOperation(operatorId, permission, requirePermission, createPrivilegedClient, operation);
}

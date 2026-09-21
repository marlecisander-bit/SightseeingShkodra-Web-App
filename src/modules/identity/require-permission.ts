import "server-only";
import { authorizeStaff, AuthorizationError, type Membership } from "./authorization";
import type { Permission } from "./roles";
import { createSessionClient } from "./supabase-server";

// Call inside every protected action/handler, not just a layout or navigation component.
export async function requirePermission(operatorId: string, permission: Permission) {
  try {
    const client = await createSessionClient();
    return await authorizeStaff({
      async getVerifiedUser() {
        const { data, error } = await client.auth.getUser();
        if (error || !data.user) return null;
        return { id: data.user.id };
      },
      async getMembership(userId, selectedOperatorId) {
        const { data, error } = await client.from("staff_profiles")
          .select("id,operator_id,auth_user_id,role,is_active")
          .eq("operator_id", selectedOperatorId).eq("auth_user_id", userId).maybeSingle();
        if (error) throw new AuthorizationError("UNAVAILABLE");
        return data as Membership | null;
      },
    }, operatorId, permission);
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    throw new AuthorizationError("UNAVAILABLE");
  }
}

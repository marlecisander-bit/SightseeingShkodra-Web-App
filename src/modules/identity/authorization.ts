import { hasPermission, isStaffRole, type Permission, type StaffRole } from "./roles";

export class AuthorizationError extends Error {
  constructor(public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "UNAVAILABLE") {
    super(code === "UNAVAILABLE" ? "Authorization is temporarily unavailable" : "Access denied");
    this.name = "AuthorizationError";
  }
}

export type Membership = {
  id: string;
  operator_id: string;
  auth_user_id: string;
  role: string;
  is_active: boolean;
};
export type StaffContext = Readonly<{
  userId: string; operatorId: string; staffProfileId: string; role: StaffRole;
}>;
export type IdentitySource = {
  getVerifiedUser(): Promise<{ id: string } | null>;
  getMembership(userId: string, operatorId: string): Promise<Membership | null>;
};

// Internal orchestration with a test seam. Server entry points supply the trusted source.
export async function authorizeStaff(
  source: IdentitySource, operatorId: string, permission: Permission,
): Promise<StaffContext> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operatorId)) {
    throw new AuthorizationError("FORBIDDEN");
  }
  // PostgreSQL UUID values are returned in canonical lowercase.
  operatorId = operatorId.toLowerCase();
  try {
    const user = await source.getVerifiedUser();
    if (!user) throw new AuthorizationError("UNAUTHENTICATED");
    const membership = await source.getMembership(user.id, operatorId);
    if (!membership || membership.auth_user_id !== user.id || membership.operator_id !== operatorId
      || membership.is_active !== true || !isStaffRole(membership.role)
      || !hasPermission(membership.role, permission)) {
      throw new AuthorizationError("FORBIDDEN");
    }
    return Object.freeze({ userId: user.id, operatorId, staffProfileId: membership.id, role: membership.role });
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    // Never leak tokens, provider responses, database details or credentials.
    throw new AuthorizationError("UNAVAILABLE");
  }
}

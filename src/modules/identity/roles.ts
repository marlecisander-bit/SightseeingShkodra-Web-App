export const staffRoles = [
  "owner",
  "admin",
  "operations",
  "content_editor",
] as const;
export type StaffRole = (typeof staffRoles)[number];

export const permissions = [
  "staff.manage",
  "operator.manage",
  "integrations.manage",
  "catalog.read",
  "catalog.manage",
  "departures.manage",
  "bookings.read",
  "bookings.create",
  "bookings.cancel",
  "payments.collect",
  "payments.refund",
  "customers.read",
  "content.manage",
  "tracking.manage",
  "audit.read",
] as const;
export type Permission = (typeof permissions)[number];

const rolePermissions: Record<StaffRole, readonly Permission[]> = {
  owner: permissions,
  admin: [
    "catalog.read",
    "catalog.manage",
    "departures.manage",
    "bookings.read",
    "bookings.create",
    "bookings.cancel",
    "payments.collect",
    "payments.refund",
    "customers.read",
    "content.manage",
    "tracking.manage",
    "audit.read",
  ],
  operations: [
    "catalog.read",
    "departures.manage",
    "bookings.read",
    "bookings.create",
    "bookings.cancel",
    "payments.collect",
    "customers.read",
    "tracking.manage",
  ],
  content_editor: ["catalog.read", "content.manage"],
};

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && staffRoles.some((role) => role === value);
}

// Pure policy check; this alone does not authenticate the caller.
export function hasPermission(role: unknown, permission: Permission): boolean {
  return isStaffRole(role) && rolePermissions[role].includes(permission);
}

import type { Permission } from "./roles";
import type { StaffContext } from "./authorization";

// Internal dependency seam, never accept these callbacks from a client request.
export async function runAuthorizedOperation<Client, Result>(
  operatorId: string,
  permission: Permission,
  authorize: (operatorId: string, permission: Permission) => Promise<StaffContext>,
  createClient: () => Client,
  operation: (client: Client, context: StaffContext) => Promise<Result>,
): Promise<Result> {
  const context = await authorize(operatorId, permission);
  // No privileged client or secret access until authorization succeeds.
  return operation(createClient(), context);
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StaffContext } from "../identity/authorization";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type StaffActivity = {
  idempotencyKey: string;
  entityType: string;
  entityId: string;
  eventType: string;
  payload: Record<string, Json>;
  action: string;
  metadata: Record<string, Json>;
  schemaVersion?: number;
};

export class ActivityPersistenceError extends Error {
  constructor() { super("Activity could not be persisted"); this.name = "ActivityPersistenceError"; }
}

// Called only inside an authorized server domain operation. Never accept context from a request body.
// This RPC atomically saves the event/audit pair, not a separately issued business mutation.
export async function persistStaffActivity(
  client: Pick<SupabaseClient, "rpc">, context: StaffContext, activity: StaffActivity,
): Promise<{ eventId: string; auditId: string }> {
  try {
    const { data, error } = await client.rpc("record_domain_activity", {
      p_operator_id: context.operatorId,
      p_actor_id: context.staffProfileId,
      p_idempotency_key: activity.idempotencyKey,
      p_entity_type: activity.entityType,
      p_entity_id: activity.entityId,
      p_event_type: activity.eventType,
      p_payload: activity.payload,
      p_action: activity.action,
      p_metadata: activity.metadata,
      p_schema_version: activity.schemaVersion ?? 1,
    });
    if (error || !Array.isArray(data) || data.length !== 1
      || typeof data[0]?.event_id !== "string" || typeof data[0]?.audit_id !== "string") {
      throw new ActivityPersistenceError();
    }
    return { eventId: data[0].event_id, auditId: data[0].audit_id };
  } catch {
    // Raw provider messages may contain SQL details or submitted payloads.
    throw new ActivityPersistenceError();
  }
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Confirmation,
  Delivery,
  NotificationStore,
  Outcome,
} from "./booking-notifications";
/** Only instantiate in a trusted worker, never from a caller-controlled operator or public route. */
export function notificationStore(
  client: Pick<SupabaseClient, "rpc">,
): NotificationStore {
  const call = async (name: string, args: Record<string, unknown>) => {
    const { data, error } = await client.rpc(name, args);
    if (error) throw Error("Notification persistence unavailable");
    return data;
  };
  const identity = (j: Delivery) => ({
    p_operator_id: j.operator_id,
    p_delivery_id: j.id,
    p_token: j.lease_token,
  });
  return {
    async claim(operatorId) {
      const rows = await call("claim_booking_notification_v1", {
        p_operator_id: operatorId,
      });
      if (!Array.isArray(rows) || rows.length > 1)
        throw Error("Invalid notification claim");
      return (rows[0] as Delivery) ?? null;
    },
    async read(job) {
      return (await call(
        "read_booking_notification_v1",
        identity(job),
      )) as Confirmation;
    },
    async begin(job, channel) {
      return (
        (await call("begin_booking_notification_v1", {
          ...identity(job),
          p_channel: channel,
        })) === true
      );
    },
    async finish(job, outcome: Outcome, code, reference) {
      await call("finish_booking_notification_v1", {
        ...identity(job),
        p_outcome: outcome,
        p_error_code: code ?? null,
        p_reference: reference ?? null,
      });
    },
  };
}

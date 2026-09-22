import "server-only";
import { withOperatorService } from "../identity/operator-service";
export async function collectMeetingPointPayment(
  operatorId: string,
  orderId: string,
) {
  return withOperatorService(
    operatorId,
    "payments.collect",
    async (client, context) => {
      const { data, error } = await client.rpc(
        "collect_meeting_point_payment_v1",
        {
          p_operator_id: context.operatorId,
          p_order_id: orderId,
          p_actor_id: context.staffProfileId,
        },
      );
      if (error || !data) throw Error("Unable to record collection");
      return data as string;
    },
  );
}

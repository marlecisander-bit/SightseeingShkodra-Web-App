import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePositions, validOperator, type Snapshot } from "./positions";

/** Caller must supply an authorized, request-scoped client and trusted operator binding.
 * No credentials, public endpoint, secondary store or writes are introduced here.
 */
export async function readPositions(client: Pick<SupabaseClient, "from">, operatorId: string): Promise<Snapshot> {
  if (!validOperator(operatorId)) return { state: "unavailable", positions: [] };
  try {
    const { data, error } = await client.from("vehicle_positions")
      .select("operator_id,vehicle_id,lat,lng,updated_at")
      .eq("operator_id", operatorId).order("vehicle_id").limit(501)
      .abortSignal(AbortSignal.timeout(5000));
    if (error) return { state: "unavailable", positions: [] };
    return normalizePositions(operatorId, data);
  } catch {
    return { state: "unavailable", positions: [] };
  }
}

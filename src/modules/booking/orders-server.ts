import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { PendingOrder, CreatePendingOrderRequest } from "./contracts";
export type { PendingOrder } from "./contracts";
export class CheckoutError extends Error {
  constructor(
    public readonly code:
      | "INVALID_REQUEST"
      | "NOT_FOUND"
      | "HOLD_INACTIVE"
      | "CONFLICT"
      | "UNAVAILABLE",
  ) {
    super(code);
  }
}
// Recovery projection after a lost response/reload. No customer contact data is returned.
export async function readPendingOrder(
  operatorId: string,
  holdId: string,
  sessionKey: string,
): Promise<PendingOrder | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new CheckoutError("UNAVAILABLE");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        }),
    },
  });
  const hold = await client
    .from("inventory_holds")
    .select("id,order_id,expires_at")
    .eq("operator_id", operatorId)
    .eq("id", holdId)
    .eq("session_key", sessionKey)
    .maybeSingle();
  if (hold.error) throw new CheckoutError("UNAVAILABLE");
  if (!hold.data) throw new CheckoutError("NOT_FOUND");
  if (!hold.data.order_id) return null;
  const order = await client
    .from("orders")
    .select("id,status,currency,total,collection_mode")
    .eq("operator_id", operatorId)
    .eq("id", hold.data.order_id)
    .single();
  const items = await client
    .from("booking_items")
    .select("id,product_id,departure_id,quantity,unit_price,total_price,status,passenger_snapshot")
    .eq("operator_id", operatorId)
    .eq("order_id", hold.data.order_id)
    .order("id");
  if (order.error || items.error) throw new CheckoutError("UNAVAILABLE");
  const booking = await client
    .from("bookings")
    .select("management_token,booking_reference,status,qr_token,qr_created_at,checked_in_at")
    .eq("operator_id", operatorId)
    .eq("order_id", hold.data.order_id)
    .maybeSingle();
  const payments = await client
    .from("payments")
    .select("status")
    .eq("operator_id", operatorId)
    .eq("order_id", hold.data.order_id)
    .eq("provider", "meeting_point");
  if (booking.error || payments.error) throw new CheckoutError("UNAVAILABLE");
  const departures = await client.from("departures").select("id,service_date,start_time")
    .eq("operator_id",operatorId).in("id",items.data.map(i=>i.departure_id));
  if(departures.error) throw new CheckoutError("UNAVAILABLE");
  return {
    managementToken: booking.data?.management_token,
    pass: booking.data?.qr_token ? {
      token: booking.data.qr_token, createdAt: booking.data.qr_created_at, checkedInAt: booking.data.checked_in_at,
      departures: items.data.flatMap(i=>{
        const departure=departures.data.find(d=>d.id===i.departure_id);
        return departure ? [{date:departure.service_date,time:departure.start_time,guests:i.quantity}] : [];
      }),
    } : undefined,
    collectionMode: order.data.collection_mode,
    bookingReference: booking.data?.booking_reference,
    bookingStatus: booking.data?.status,
    paymentStatus: payments.data.some((p) => p.status === "paid")
      ? "paid"
      : "due",
    version: 1,
    orderId: order.data.id,
    status: order.data.status,
    currency: order.data.currency,
    total: order.data.total,
    holdId,
    expiresAt: hold.data.expires_at,
    items: items.data.map((i) => ({
      id: i.id,
      productId: i.product_id,
      departureId: i.departure_id,
      quantity: i.quantity,
      passengerSnapshot:i.passenger_snapshot,
      unitPrice: i.unit_price,
      total: i.total_price,
      status: i.status,
    })),
  };
}
// Session keys come from trusted server session handling, not arbitrary browser input.
export async function createPendingOrder(
  input: CreatePendingOrderRequest,
  meetingPoint = false,
): Promise<PendingOrder> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new CheckoutError("UNAVAILABLE");
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (request, init) =>
          fetch(request, {
            ...init,
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
          }),
      },
    });
    const { data, error } = await client.rpc(
      meetingPoint
        ? "create_meeting_point_booking_v1"
        : "create_pending_order_v1",
      {
        p_operator_id: input.operatorId,
        p_hold_id: input.holdId,
        p_session_key: input.sessionKey,
        p_customer_name: input.customer.name,
        p_customer_email: input.customer.email,
        p_customer_phone: input.customer.phone ?? null,
      },
    );
    if (error) {
      const codes: Record<
        string,
        ConstructorParameters<typeof CheckoutError>[0]
      > = {
        "22023": "INVALID_REQUEST",
        "22P02": "INVALID_REQUEST",
        P0002: "NOT_FOUND",
        P0001: "HOLD_INACTIVE",
        "23505": "CONFLICT",
      };
      throw new CheckoutError(codes[error.code] ?? "UNAVAILABLE");
    }
    if (!data?.orderId || !Array.isArray(data.items))
      throw new CheckoutError("UNAVAILABLE");
    // Confirmation already committed; a display read failure must not undo or misreport it.
    if (meetingPoint) {
      try { return await readPendingOrder(input.operatorId,input.holdId,input.sessionKey) ?? data as PendingOrder; }
      catch { return data as PendingOrder; }
    }
    return data as PendingOrder;
  } catch (error) {
    if (error instanceof CheckoutError) throw error;
    throw new CheckoutError("UNAVAILABLE");
  }
}

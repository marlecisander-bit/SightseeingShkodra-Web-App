import { passengerCount, type PassengerCounts } from "@/modules/booking/passengers";
import { cookies } from "next/headers";
import { getHomepage } from "@/modules/content/homepage-server";
import { getAvailability } from "@/modules/booking/availability-server";
import { AvailabilityError } from "@/modules/booking/availability";
import {
  createHold,
  readHold,
  releaseHold,
  HoldError,
} from "@/modules/booking/holds-server";
import {
  createPendingOrder,
  readPendingOrder,
  CheckoutError,
} from "@/modules/booking/orders-server";
import {
  checkoutCookie,
  issueCheckoutSession,
  verifyCheckoutSession,
} from "@/modules/booking/checkout-session";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) =>
  Response.json({ error }, { status, headers });
export async function POST(request: Request) {
  // Next may normalize request.url to its listening hostname. Compare the browser
  // Origin against the actual Host header, never a visitor-supplied tenant value.
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    if (
      origin.host !== request.headers.get("host") ||
      !["http:", "https:"].includes(origin.protocol) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    )
      return fail("FORBIDDEN", 403);
  } catch {
    return fail("FORBIDDEN", 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail("INVALID_REQUEST");
  let body: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) return fail("INVALID_REQUEST");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 4096) {
        await reader.cancel();
        return fail("INVALID_REQUEST", 413);
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || Array.isArray(body) || typeof body !== "object")
      return fail("INVALID_REQUEST");
  } catch {
    return fail("INVALID_REQUEST");
  }
  try {
    const secret = process.env.CHECKOUT_SESSION_SECRET ?? "";
    if (secret.length < 32) return fail("UNAVAILABLE", 503);
    const jar = await cookies();
    let sessionKey = verifyCheckoutSession(
      jar.get(checkoutCookie)?.value,
      secret,
    );
    if (body.action === "session" && Object.keys(body).length === 1) {
      if (!sessionKey) {
        const token = issueCheckoutSession(secret);
        jar.set(checkoutCookie, token, {
          httpOnly: true,
          sameSite: "strict",
          secure:
            process.env.APP_ENV !== "development" ||
            request.headers.get("origin")?.startsWith("https:") === true,
          path: "/api/public/checkout",
          maxAge: 86400,
        });
        sessionKey = verifyCheckoutSession(token, secret);
      }
      return Response.json({ ready: Boolean(sessionKey) }, { headers });
    }
    if (!sessionKey) return fail("SESSION_REQUIRED", 401);
    const operatorId = process.env.PUBLIC_OPERATOR_ID;
    if (!operatorId || !uuid.test(operatorId)) return fail("UNAVAILABLE", 503);
    if (body.action === "hold") {
      if (
        Object.keys(body).filter(k=>k!=="passengers").sort().join() !==
          "action,date,departureId,guests,requestId" ||
        typeof body.departureId !== "string" ||
        !uuid.test(body.departureId) ||
        typeof body.requestId !== "string" ||
        !uuid.test(body.requestId) ||
        typeof body.date !== "string" ||
        typeof body.guests !== "number"
      )
        return fail("INVALID_REQUEST");
      const passengers=body.passengers as PassengerCounts|undefined;
      if(passengers){try{if(passengerCount(passengers)!==body.guests)return fail("INVALID_REQUEST");}catch{return fail(passengers.adult<1&&(passengers.child>0||passengers.infant>0)?"ADULT_REQUIRED":"INVALID_REQUEST");}}
      const home = await getHomepage();
      if (!home.product)
        return fail(
          home.state === "unavailable" ? "UNAVAILABLE" : "NOT_PUBLISHED",
          home.state === "unavailable" ? 503 : 404,
        );
      const quote = await getAvailability({
        version: 1,
        operatorId,
        productId: home.product.id,
        date: body.date,
        guests: body.guests,passengers,
      });
      // Domain allocation checks capacity atomically. Do not reject a retry based on seats already held by this session.
      if (!quote.departures.some((d) => d.id === body.departureId))
        return fail("NOT_FOUND", 404);
      const hold = await createHold({
        operatorId,
        departureId: body.departureId,
        quantity: body.guests,passengers,
        requestId: body.requestId,
        sessionKey,
      });
      return Response.json(
        { hold, serverNow: new Date().toISOString() },
        { headers },
      );
    }
    if (typeof body.holdId !== "string" || !uuid.test(body.holdId))
      return fail("INVALID_REQUEST");
    if (
      (body.action === "read" || body.action === "release") &&
      Object.keys(body).sort().join() === "action,holdId"
    ) {
      const hold = await (body.action === "read" ? readHold : releaseHold)(
        operatorId,
        body.holdId,
        sessionKey,
      );
      if (body.action === "release" && hold.status === "consumed")
        return fail("RESERVATION_CONFIRMED", 409);
      return Response.json(
        {
          hold,
          order:
            body.action === "read"
              ? await readPendingOrder(operatorId, body.holdId, sessionKey)
              : null,
          serverNow: new Date().toISOString(),
        },
        { headers },
      );
    }
    if (
      body.action === "order" &&
      Object.keys(body).sort().join() === "action,customer,holdId"
    ) {
      const customer = body.customer as Record<string, unknown> | null;
      if (
        !customer ||
        typeof customer !== "object" ||
        Array.isArray(customer) ||
        Object.keys(customer).some(
          (k) => !["name", "email", "phone"].includes(k),
        ) ||
        typeof customer.name !== "string" ||
        typeof customer.email !== "string" ||
        customer.name.length > 200 ||
        customer.email.length > 254 ||
        (customer.phone !== undefined &&
          (typeof customer.phone !== "string" || customer.phone.length > 50))
      )
        return fail("INVALID_REQUEST");
      const order = await createPendingOrder(
        {
          operatorId,
          holdId: body.holdId,
          sessionKey,
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone as string | undefined,
          },
        },
        true,
      );
      return Response.json(
        { order, serverNow: new Date().toISOString() },
        { headers },
      );
    }
    return fail("INVALID_REQUEST");
  } catch (error) {
    if (error instanceof AvailabilityError && error.code === "INVALID_REQUEST")
      return fail("INVALID_REQUEST");
    if (error instanceof HoldError || error instanceof CheckoutError)
      return fail(
        error.code,
        error.code === "UNAVAILABLE"
          ? 503
          : error.code === "NOT_FOUND"
            ? 404
            : 409,
      );
    return fail("UNAVAILABLE", 503);
  }
}

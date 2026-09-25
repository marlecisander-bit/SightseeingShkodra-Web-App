import { authorizedEmailWorker, runBookingEmailWorker } from "@/modules/integrations/booking-email-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!authorizedEmailWorker(request.headers.get("authorization"))) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try { return Response.json(await runBookingEmailWorker(), { headers: { "Cache-Control": "no-store" } }); }
  catch { console.error(JSON.stringify({ component: "booking_email", status: "worker_failed" })); return Response.json({ error: "Email worker unavailable" }, { status: 503 }); }
}

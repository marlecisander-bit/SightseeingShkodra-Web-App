import { passengerCount, type PassengerCounts } from "./passengers";
import { AvailabilityError, validateAvailabilityRequest } from "./availability";
import type { AvailabilityQuote, AvailabilityRequest } from "./contracts";

type Sources = {
  resolve: () => Promise<{
    operatorId: string;
    productId: string;
    timezone: string;
  } | null>;
  quote: (request: AvailabilityRequest) => Promise<AvailabilityQuote>;
};
const placeholderId = "00000000-0000-4000-8000-000000000000";
export async function publicAvailability(request: Request, sources: Sources) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const errorResponse = (error: string, status: number) =>
    Response.json({ error }, { status, headers });
  const params = new URL(request.url).searchParams;
  const date = params.get("date") ?? "",
    guests = Number(params.get("guests"));
  let passengers:PassengerCounts|undefined;
  try {
    if(params.has("adult")||params.has("child")||params.has("infant")){passengers={adult:Number(params.get("adult")),child:Number(params.get("child")),infant:Number(params.get("infant"))};if(["adult","child","infant"].some(k=>params.getAll(k).length!==1)||passengerCount(passengers)!==guests)throw Error();}
    if (
      [...params.keys()].some((key) => !["date","guests","adult","child","infant"].includes(key)) ||
      params.getAll("date").length !== 1 ||
      params.getAll("guests").length !== 1 ||
      !/^[1-9]\d{0,9}$/.test(params.get("guests") ?? "")
    )
      throw new AvailabilityError("INVALID_REQUEST");
    validateAvailabilityRequest({
      version: 1,
      operatorId: placeholderId,
      productId: placeholderId,
      date,
      guests,passengers,
    });
  } catch {
    return errorResponse("INVALID_REQUEST", 400);
  }
  try {
    const binding = await sources.resolve();
    if (!binding) return errorResponse("NOT_PUBLISHED", 404);
    const quote = await sources.quote({
      version: 1,
      operatorId: binding.operatorId,
      productId: binding.productId,
      date,
      guests,passengers,
    });
    return Response.json({ quote, timezone: binding.timezone }, { headers });
  } catch (error) {
    if (error instanceof AvailabilityError && error.code === "NOT_FOUND")
      return errorResponse("NOT_PUBLISHED", 404);
    if(error instanceof AvailabilityError&&error.code==="INVALID_CONFIGURATION")return errorResponse("PRICING_UNAVAILABLE",409);
    return errorResponse("UNAVAILABLE", 503);
  }
}

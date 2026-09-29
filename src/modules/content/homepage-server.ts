import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAvailability } from "../booking/availability-server";
import { emptyHomepage, loadHomepage } from "./homepage";

/** Fixed deployment binding: never derive tenant or product from request/search parameters. */
export const getHomepage = cache(async () => {
  await connection();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return emptyHomepage("unconfigured");
  let quoteCalls = 0;
  let lookupDeadline: number | undefined;
  const remainingLookup = () => {
    lookupDeadline ??= Date.now() + 5000;
    const remaining = lookupDeadline - Date.now();
    if (remaining <= 0) throw new Error("Hero fare lookup timed out");
    return remaining;
  };
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(5000)]) : AbortSignal.timeout(5000),
        }),
    },
  });
  return loadHomepage(
    {
      operatorId: process.env.PUBLIC_OPERATOR_ID,
      productSlug: process.env.PUBLIC_HOMEPAGE_PRODUCT_SLUG,
    },
    {
      read: async (operatorId, productSlug) => {
        const { data, error } = await client.rpc("read_public_homepage_v1", {
          p_operator_id: operatorId,
          p_product_slug: productSlug,
        });
        if (error) throw new Error("Homepage unavailable");
        return data;
      },
      quote: (request) => getAvailability(request, AbortSignal.timeout(++quoteCalls > 1 ? remainingLookup() : 5000)),
      nextDate: async (operatorId, productId, after) => {
        const {data,error} = await client.rpc("next_operational_date_v1", {p_operator:operatorId,p_product:productId,p_after:after}).abortSignal(AbortSignal.timeout(remainingLookup()));
        if(error) throw new Error("Next service date unavailable");
        return typeof data === "string" ? data : null;
      },
    },
  );
});

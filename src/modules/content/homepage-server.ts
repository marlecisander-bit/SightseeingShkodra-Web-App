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
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
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
      quote: (request) => getAvailability(request, AbortSignal.timeout(5000)),
    },
  );
});

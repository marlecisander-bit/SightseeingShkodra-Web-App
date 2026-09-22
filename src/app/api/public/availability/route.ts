import { createClient } from "@supabase/supabase-js";
import { getAvailability } from "@/modules/booking/availability-server";
import { publicAvailability } from "@/modules/booking/public-availability";

export async function GET(request: Request) {
  return publicAvailability(request, {
    resolve: async () => {
      const operatorId = process.env.PUBLIC_OPERATOR_ID;
      const slug = process.env.PUBLIC_HOMEPAGE_PRODUCT_SLUG;
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SECRET_KEY;
      if (!operatorId || !slug || !url || !key)
        throw new Error("Not configured");
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
      const { data, error } = await client.rpc("read_public_homepage_v1", {
        p_operator_id: operatorId,
        p_product_slug: slug,
      });
      if (error || !data || data.operator?.id !== operatorId)
        throw new Error("Unavailable");
      if (!data.product) return null;
      return {
        operatorId,
        productId: data.product.id as string,
        timezone: data.operator.timezone as string,
      };
    },
    quote: (input) => getAvailability(input, AbortSignal.timeout(5000)),
  });
}

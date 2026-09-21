import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./modules/identity/supabase-config";

// Session refresh only. Authorization must run again in each protected handler.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  try {
    const { url, key } = getSupabaseConfig();
    const client = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          const previous = response.cookies.getAll();
          response = NextResponse.next({ request });
          previous.forEach((cookie) => response.cookies.set(cookie));
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    });
    await client.auth.getClaims();
    return response;
  } catch {
    return new NextResponse("Authentication is temporarily unavailable", {
      status: 503, headers: { "Cache-Control": "private, no-store" },
    });
  }
}

export const config = { matcher: ["/admin/:path*", "/auth/:path*", "/api/admin/:path*"] };

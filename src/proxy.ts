import {canonicalAdminRedirect} from "./modules/identity/admin-origin";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./modules/identity/supabase-config";

// Session refresh only. Authorization must run again in each protected handler.
export async function proxy(request: NextRequest) {
  const destination=canonicalAdminRedirect(request.url,request.method);
  if(destination){const redirected=NextResponse.redirect(destination,307);redirected.headers.set("Cache-Control","private, no-store");return redirected;}
  // Public PWA bootstrap must not depend on an authenticated refresh or auth availability.
  // Protected handlers/pages still authorize every read and write.
  if (["/admin/sw.js", "/admin/manifest.webmanifest"].includes(request.nextUrl.pathname)) return NextResponse.next();
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

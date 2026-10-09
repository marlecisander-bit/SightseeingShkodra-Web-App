import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unavailableWebsiteContent, validateWebsiteContent, type WebsiteContent } from "./website-schema";
import { withOperatorService } from "../identity/operator-service";

export type WebsiteRecord = { id: string; updated_at: string; published_at: string | null; body: { content: WebsiteContent }; published_body: { content: WebsiteContent } | null };
// Request-scoped deduplication only; never resurrect stale optional sections on failure.
export async function loadWebsitePublication(env: NodeJS.ProcessEnv = process.env, transport: typeof fetch = fetch, report: (event: object) => void = event => console.error(JSON.stringify(event))): Promise<{ content: WebsiteContent; published: boolean; unavailable?: boolean }> {
  const operator = env.PUBLIC_OPERATOR_ID;
  const missing = ["PUBLIC_OPERATOR_ID", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"].filter(key => !env[key]);
  const unavailable = (reason: string) => {
    // Never log credentials, raw provider errors, URLs or CMS payloads.
    report({component:"website_publication",reason,...(reason === "missing_configuration" ? {missing} : {})});
    return {content:unavailableWebsiteContent(),published:false,unavailable:reason !== "not_published"};
  };
  if (missing.length) return unavailable("missing_configuration");
  let stage = "client_configuration";
  try {
    const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false }, global: { fetch: (input, init) => transport(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(4000) }) } });
    stage = "query_failed";
    const { data, error } = await client.from("content_pages").select("published_body").eq("operator_id", operator).eq("slug", "website-homepage").eq("status", "published").maybeSingle();
    if (error) return unavailable("query_failed");
    if (!data?.published_body) return unavailable("not_published");
    stage = "invalid_published_content";
    const content = validateWebsiteContent(data.published_body.content);
    return { content, published: true };
  } catch { return unavailable(stage); }
}
export const getWebsitePublication = cache(async () => {
  await connection();
  return loadWebsitePublication();
});
export async function getPublishedWebsite() { return (await getWebsitePublication()).content; }

export async function getWebsiteEditor(operatorId: string): Promise<WebsiteRecord> {
  return withOperatorService(operatorId, "content.manage", async (client) => {
    const { data, error } = await client.from("content_pages").select("id,updated_at,published_at,body,published_body").eq("operator_id", operatorId).eq("slug", "website-homepage").maybeSingle();
    if (error || !data) throw Error("Homepage content has not been initialized");
    data.body.content = validateWebsiteContent(data.body.content);
    if (data.published_body) data.published_body.content = validateWebsiteContent(data.published_body.content);
    return data as WebsiteRecord;
  });
}

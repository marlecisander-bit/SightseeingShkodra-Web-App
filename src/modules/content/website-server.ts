import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { initialWebsiteContent, validateWebsiteContent, type WebsiteContent } from "./website-schema";
import { withOperatorService } from "../identity/operator-service";

export type WebsiteRecord = { id: string; updated_at: string; published_at: string | null; body: { content: WebsiteContent }; published_body: { content: WebsiteContent } | null };
// Only published editorial data enters this cache. Drafts never use this reader.
const lastPublished = new Map<string, WebsiteContent>();
export const getWebsitePublication = cache(async (): Promise<{ content: WebsiteContent; published: boolean }> => {
  await connection();
  const operator = process.env.PUBLIC_OPERATOR_ID;
  if (!operator || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return { content: initialWebsiteContent, published: false };
  try {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false }, global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(4000) }) } });
    const { data, error } = await client.from("content_pages").select("published_body").eq("operator_id", operator).eq("slug", "website-homepage").eq("status", "published").maybeSingle();
    if (error || !data?.published_body) throw Error("Published content unavailable");
    const content = validateWebsiteContent(data.published_body.content);
    lastPublished.set(operator, content);
    return { content, published: true };
  } catch { return { content: lastPublished.get(operator) ?? initialWebsiteContent, published: lastPublished.has(operator) }; }
});
export async function getPublishedWebsite() { return (await getWebsitePublication()).content; }

export async function getWebsiteEditor(operatorId: string): Promise<WebsiteRecord> {
  return withOperatorService(operatorId, "content.manage", async (client) => {
    const { data, error } = await client.from("content_pages").select("id,updated_at,published_at,body,published_body").eq("operator_id", operatorId).eq("slug", "website-homepage").maybeSingle();
    if (error || !data) throw Error("Homepage content has not been initialized");
    validateWebsiteContent(data.body.content);
    return data as WebsiteRecord;
  });
}

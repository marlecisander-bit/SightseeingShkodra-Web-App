import { getWebsiteEditor } from "@/modules/content/website-server";
import { getHomepage } from "@/modules/content/homepage-server";
import { HomepageView } from "@/components/public/homepage-view";
import { BookingProvider, Header } from "@/components/public/booking";
import { Footer } from "@/components/public/ui";
import "../../../(public)/public.css";
import { redirect } from "next/navigation";
import { requirePermission } from "@/modules/identity/require-permission";
export const metadata = { title: "Private homepage draft preview", robots: { index: false, follow: false } };
export default async function WebsitePreview({ params }: { params: Promise<{ operatorId: string }> }) {
  const { operatorId } = await params;
  try { await requirePermission(operatorId, "content.manage"); }
  catch { redirect("/auth/sign-in"); }
  const record = await getWebsiteEditor(operatorId);
  const home = await getHomepage();
  const content = record.body.content;
  return <><p>Private saved draft preview · Nothing is published by viewing this page.</p><div className="public-site"><BookingProvider><Header content={content} /><HomepageView home={home} content={content} /><Footer content={content} /></BookingProvider></div></>;
}

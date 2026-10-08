"use server";
import { hasPermission } from "@/modules/identity/roles";
import { ownerActionError } from "./action-error";
import { revalidatePath } from "next/cache";
import { withOperatorService } from "@/modules/identity/operator-service";
import { validateWebsiteContent, editableWebsiteSections } from "@/modules/content/website-schema";
import { IMAGE_UPLOAD_BYTES, imageSizeError } from "@/modules/content/image-upload";

export async function saveWebsiteSection(operatorId: string, sectionId: string, form: FormData) {
  try {
    const section = editableWebsiteSections.find(section => section.id === sectionId);
    if (!section) throw Error("Unknown section");
    const operation = form.get("operation");
    if (operation !== "draft" && operation !== "publish") throw Error("Unknown operation");
    await withOperatorService(operatorId, operation === "publish" ? "content.publish" : "content.draft", async (client, context) => {
      if (["footer","whatsapp","legalprivacy","legalterms"].includes(sectionId) && !hasPermission(context.role,"content.sensitive")) throw Error("Owner access required for business, contact and legal settings.");
      const { data: current, error } = await client.from("content_pages").select("body,updated_at").eq("operator_id", context.operatorId).eq("slug", "website-homepage").single();
      if (error || !current) throw Error("Homepage unavailable");
      const content = validateWebsiteContent(current.body.content);
      for (const field of section.fields) {
        const value = form.get(field.key);
        if (typeof value !== "string") throw Error(`Check ${field.label}`);
        content[field.key] = value.replaceAll("\r\n", "\n");
      }
      validateWebsiteContent(content);
      const result = await client.rpc("save_website_content_v1", { p_operator_id: context.operatorId, p_actor_id: context.staffProfileId, p_content: content, p_expected_updated_at: form.get("updated_at"), p_operation: operation });
      if (result.error) throw Error(result.error.code === "PT409" ? "This homepage changed. Reload before saving; copy your unsaved edits first." : "Unable to save homepage");
    });
    revalidatePath("/", "layout");
    revalidatePath(`/admin/${operatorId}/content`);
    return { saved: operation === "publish" ? "Published homepage changes." : "Draft saved. The public page is unchanged." };
  } catch (error) { return { error: ownerActionError(error, "Your changes could not be saved. Check your access and try again.") }; }
}

export async function uploadWebsiteImage(operatorId: string, form: FormData) {
  try {
    return await withOperatorService(operatorId, "content.draft", async (client, context) => {
      const file = form.get("image");
      if (!(file instanceof File) || file.size < 1) throw Error("Choose a non-empty image.");
      if (file.size > IMAGE_UPLOAD_BYTES) throw Error(imageSizeError(file.size));
      const bytes = Buffer.from(await file.arrayBuffer());
      const type = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? ["jpg", "image/jpeg"] : bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? ["png", "image/png"] : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? ["webp", "image/webp"] : bytes.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(bytes.toString("ascii", 8, 12)) ? ["avif", "image/avif"] : null;
      if (!type) throw Error("Choose a JPEG, PNG, WebP or AVIF image. SVG and HTML are not accepted.");
      const path = `${context.operatorId}/${crypto.randomUUID()}.${type[0]}`;
      const { error } = await client.storage.from("website-media").upload(path, bytes, { contentType: type[1], upsert: false });
      if (error) throw Error("Image upload failed. Try again.");
      return { url: client.storage.from("website-media").getPublicUrl(path).data.publicUrl };
    });
  } catch (error) { return { error: ownerActionError(error, "Image could not be uploaded. Check your access and try again.") }; }
}

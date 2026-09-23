"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { withOperatorService } from "../../modules/identity/operator-service";
export async function saveCatalog(
  operatorId: string,
  entity: string,
  form: FormData,
) {
  if (entity !== "product" && entity !== "supplier")
    return { error: "Route stops are managed in the live map app." };
  let failed = false;
  try {
    await withOperatorService(
      operatorId,
      "catalog.manage",
      async (client, context) => {
        const data: Record<string, string> = {};
        for (const key of [
          "title",
          "name",
          "slug",
          "type",
          "status",
          "supplier_id",
          "meta_title",
          "meta_description",
          "og_image",
          "og_image_alt",
        ]) {
          const value = form.get(key);
          if (typeof value === "string") data[key] = value;
        }
        const id = form.get("id");
        const remove = form.get("operation") === "remove";
        if (remove && form.get("confirm_remove") !== "yes")
          throw Error("Confirmation required");
        const { error } = await client.rpc("save_catalog_v1", {
          p_operator_id: context.operatorId,
          p_actor_id: context.staffProfileId,
          p_entity: entity,
          p_id: typeof id === "string" && id ? id : null,
          p_data: data,
          p_delete: remove,
        });
        if (error) throw Error("Catalog save failed");
      },
    );
  } catch {
    failed = true;
  }
  if (failed)
    return {
      error:
        "Unable to save. Check the unique slug, required SEO/image fields and linked records. Removal requires confirmation; linked suppliers cannot be deleted. Your entries are preserved.",
    };
  const path = `/admin/${encodeURIComponent(operatorId)}/catalog`;
  revalidatePath(path);
  redirect(`${path}?result=${failed ? "error" : "saved"}`);
}

export async function saveProductPricing(
  operatorId: string,
  productId: string,
  form: FormData,
) {
  let message = "";
  try {
    await withOperatorService(
      operatorId,
      "catalog.manage",
      async (client, context) => {
        const price = form.get("price_eur"),
          stamp = form.get("updated_at");
        if (typeof price !== "string" || typeof stamp !== "string")
          throw Error("Invalid pricing");
        const { error } = await client.rpc("save_product_pricing_v1", {
          p_operator_id: context.operatorId,
          p_actor_id: context.staffProfileId,
          p_product_id: productId,
          p_price_eur: price.trim(),
          p_expected_updated_at: stamp,
        });
        if (error) {
          message =
            error.code === "PT409"
              ? "This product changed since you opened it. Reload and review the current price before saving."
              : "Enter a valid EUR price with at most two decimal places. Only van tours are supported.";
          throw Error("Price save failed");
        }
      },
    );
  } catch {
    return {
      error:
        message ||
        "Unable to save pricing. Your entry is preserved. Check your access and retry.",
    };
  }
  const path = `/admin/${encodeURIComponent(operatorId)}/catalog`;
  revalidatePath(path);
  revalidatePath("/");
  revalidatePath("/tour");
  redirect(`${path}?result=saved`);
}

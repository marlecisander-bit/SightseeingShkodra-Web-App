import { createSessionClient } from "../../modules/identity/supabase-server";
import { requirePermission } from "../../modules/identity/require-permission";
import { saveCatalog, saveProductPricing } from "./catalog-actions";
import { SubmitButton } from "./submit-button";
import { MutationForm } from "./mutation-form";
import { ProductNameFields } from "./product-name-fields";

type Row = Record<string, string | number | null>;
const fields: Record<
  string,
  {
    key: string;
    label: string;
    type?: string;
    required?: boolean;
    options?: string[];
  }[]
> = {
  product: [
    { key: "title", label: "Title", required: true },
    { key: "slug", label: "URL slug", required: true },
    {
      key: "type",
      label: "Experience type",
      options: ["van_tour", "boat_trip", "attraction_ticket"],
    },
    {
      key: "status",
      label: "Publication",
      options: ["draft", "published", "archived"],
    },
    { key: "meta_title", label: "SEO title (required to publish)" },
    { key: "meta_description", label: "SEO description (required to publish)" },
    { key: "og_image", label: "Social image HTTPS URL", type: "url" },
    {
      key: "og_image_alt",
      label: "Image description (required with an image)",
    },
  ],
  supplier: [
    { key: "name", label: "Supplier name", required: true },
    { key: "type", label: "Supplier type", options: ["owned", "partner"] },
  ],
};
function Editor({
  entity,
  row,
  operatorId,
  suppliers,
}: {
  entity: string;
  row: Row;
  operatorId: string;
  suppliers: Row[];
}) {
  return (
    <MutationForm
      action={saveCatalog.bind(null, operatorId, entity)}
      className="catalog-form"
    >
      <input type="hidden" name="id" value={row.id ?? ""} />
      {entity === "product" && !row.id && <ProductNameFields />}
      {fields[entity].filter(field => !(entity === "product" && !row.id &&
        (field.key === "title" || field.key === "slug"))).map((field) => (
        <label key={field.key}>
          {field.label}
          {field.options ? (
            <select
              name={field.key}
              defaultValue={String(row[field.key] ?? field.options[0])}
            >
              {field.options.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          ) : (
            <input
              name={field.key}
              type={field.type ?? "text"}
              step={
                field.type === "number"
                  ? field.key === "sort_order"
                    ? "1"
                    : "any"
                  : undefined
              }
              required={field.required}
              defaultValue={row[field.key] ?? ""}
              maxLength={
                field.type === "number"
                  ? undefined
                  : field.key === "meta_description"
                    ? 500
                    : field.key === "og_image"
                      ? 2000
                      : 200
              }
            />
          )}
        </label>
      ))}
      {entity === "product" && (
        <label>
          Supplier
          <select
            name="supplier_id"
            defaultValue={String(row.supplier_id ?? "")}
          >
            <option value="">No supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <SubmitButton
        name="operation"
        value="save"
      >
        {row.id ? "Save changes" : "Create"}
      </SubmitButton>
      {row.id && (
        <div>
          <label>
            <input type="checkbox" name="confirm_remove" value="yes" /> Confirm{" "}
            {entity === "product" ? "archive" : "deletion"}
          </label>
          <SubmitButton name="operation" value="remove" formNoValidate>
            {entity === "product" ? "Archive product" : `Delete ${entity}`}
          </SubmitButton>
        </div>
      )}
    </MutationForm>
  );
}
export async function CatalogPanel({
  operatorId,
  result,
}: {
  operatorId: string;
  result?: string;
}) {
  await requirePermission(operatorId, "catalog.manage");
  const client = await createSessionClient();
  const [p, s] = await Promise.all([
    client
      .from("products")
      .select(
        "id,title,slug,type,status,supplier_id,meta_title,meta_description,og_image,og_image_alt,pricing_rules,updated_at",
      )
      .eq("operator_id", operatorId)
      .order("title")
      .limit(100),
    client
      .from("suppliers")
      .select("id,name,type")
      .eq("operator_id", operatorId)
      .order("name")
      .limit(100),
  ]);
  if (p.error || s.error)
    return <p role="alert">Catalog is temporarily unavailable.</p>;
  const products = (p.data ?? []).map(({ pricing_rules, ...row }) => ({
      ...row,
      price_eur:
        pricing_rules?.version === 1 &&
        pricing_rules?.model === "per_guest" &&
        pricing_rules?.currency === "EUR" &&
        Number.isSafeInteger(pricing_rules.unit_price)
          ? `${BigInt(pricing_rules.unit_price) / BigInt(100)}.${String(BigInt(pricing_rules.unit_price) % BigInt(100)).padStart(2, "0")}`
          : "",
    })),
    suppliers = s.data ?? [];
  return (
    <div>
      {result && (
        <p role="status">
          {result === "saved"
            ? "Changes saved."
            : "Unable to save. Check the required fields, unique slug and linked records."}
        </p>
      )}
      <p>
        Publish only when SEO fields are ready. For van tours, set a per-guest
        EUR price below, then configure seat capacity under Departures. New
        checkouts use the current price; already saved reservations keep their
        agreed total.
      </p>
      <p>Manage route stops, routes and GPS in the live map app.</p>
      {(["product", "supplier"] as const).map((entity) => (
        <div key={entity}>
          <h2>
            {entity === "product"
              ? "Products"
              : "Suppliers"}
          </h2>
          <details>
            <summary>Create {entity}</summary>
            <Editor
              entity={entity}
              row={{}}
              operatorId={operatorId}
              suppliers={suppliers}
            />
          </details>
          {(entity === "product"
            ? products
            : suppliers
          ).map((row) => (
            <details key={row.id}>
              <summary>{"title" in row ? row.title : row.name}</summary>
              <Editor
                entity={entity}
                row={row}
                operatorId={operatorId}
                suppliers={suppliers}
              />
              {entity === "product" &&
                "type" in row &&
                row.type === "van_tour" && (
                  <MutationForm
                    action={saveProductPricing.bind(
                      null,
                      operatorId,
                      String(row.id),
                    )}
                  >
                    <h3>Van tour price</h3>
                    <input
                      type="hidden"
                      name="updated_at"
                      value={String("updated_at" in row ? row.updated_at : "")}
                    />
                    <label>
                      Price per guest (EUR)
                      <input
                        name="price_eur"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]+([.][0-9]{1,2})?"
                        maxLength={17}
                        required
                        defaultValue={String(
                          "price_eur" in row ? row.price_eur : "",
                        )}
                      />
                    </label>
                    <p>
                      Use a decimal point, for example 12.50. One rate applies
                      to every guest. Payment is due at the meeting point. Seat
                      limits are set per departure.
                    </p>
                    <SubmitButton>Save price</SubmitButton>
                  </MutationForm>
                )}
            </details>
          ))}
        </div>
      ))}
      <p>
        Showing up to 100 records per group. Referenced suppliers cannot be
        deleted.
      </p>
    </div>
  );
}

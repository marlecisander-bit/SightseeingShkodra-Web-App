import { createSessionClient } from "../../modules/identity/supabase-server";
import { requirePermission } from "../../modules/identity/require-permission";
import { saveCatalog } from "./catalog-actions";
import { SubmitButton } from "./submit-button";
import { MutationForm } from "./mutation-form";
import { ProductNameFields } from "./product-name-fields";
import { catalogFields } from "@/modules/content/catalog-fields";
import { CatalogCreate } from "./catalog-create";
import styles from "./catalog.module.css";

type Row = Record<string, string | number | null>;

export function CatalogRecordEditor({
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
      {entity === "product" && <p>Product name, status and inclusions remain managed here. Public page search titles and social images are managed in Website; product booking cards are managed there too; actual passenger prices are managed in Calendar &amp; Pricing. Existing descriptions remain available to booking emails. Historical presentation values are retained and no longer edited here.</p>}
      {entity === "product" && !row.id && <ProductNameFields />}
      {entity === "product" && row.id && <p>Page address and operational type are developer-controlled bindings.</p>}
      {catalogFields[entity].filter(field => !(entity === "product" && row.id && ["slug","type"].includes(field.key))).filter(field => !(entity === "product" && !row.id &&
        (field.key === "title" || field.key === "slug"))).map((field) => field.key === "slug" ? <details key={field.key}><summary>Advanced: page address</summary><label>Page address<input name="slug" required maxLength={200} defaultValue={row.slug ?? ""}/></label><p>Changing this address can affect existing links.</p></details> : (
        <label key={field.key}>
          {field.label}
          {field.options ? (
            <select
              name={field.key}
              defaultValue={String(row[field.key] ?? field.options[0])}
            >
              {field.options.map((value) => (
                <option key={value} value={value}>{({van_tour:"Van tour",boat_trip:"Boat trip",attraction_ticket:"Attraction ticket",owned:"Our business",partner:"Partner",draft:"Draft",published:"Published",archived:"Archived"} as Record<string,string>)[value] ?? value}</option>
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
                  : field.key === "inclusions" ? 700 : 200
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
  const s = await client.from('suppliers').select('id,name,type').eq('operator_id',operatorId).order('name').limit(100);
  if(s.error)return <p role="alert">Suppliers are temporarily unavailable.</p>;
  const suppliers=s.data??[];
  return (
    <div>
      {result && (
        <p role="status">
          {result === "saved"
            ? "Changes saved."
            : "Unable to save. Check the required fields, website address and selected supplier."}
        </p>
      )}
      {(["supplier"] as string[]).map((entity) => (
        <div key={entity} className={styles.group}>
          <h2>
            {entity === "product"
              ? "Products"
              : "Suppliers"}
          </h2>
          <CatalogCreate entity={entity}>
            <CatalogRecordEditor
              entity={entity}
              row={{}}
              operatorId={operatorId}
              suppliers={suppliers}
            />
          </CatalogCreate>
          <p className={styles.listLabel}>Existing {entity === "product" ? "products" : "suppliers"}</p>
          {(entity === "product"
            ? []
            : suppliers
          ).map((row) => (
            <details key={row.id} className={styles.record}>
              <summary>{"title" in row ? row.title : row.name}</summary>
              <div className={styles.recordBody}>
              <CatalogRecordEditor
                entity={entity}
                row={row}
                operatorId={operatorId}
                suppliers={suppliers}
              />
              {entity === "product" &&
                "type" in row &&
                row.type === "van_tour" && (
                  <p>Manage passenger prices under Calendar &amp; Pricing.</p>
                )}
              </div>
            </details>
          ))}
        </div>
      ))}
      <p>
        Showing up to 100 suppliers. Suppliers linked to products cannot be
        deleted.
      </p>
    </div>
  );
}

/** Existing active Catalog editor inventory; legacy presentation keys are compatibility-only. */
export const retainedCatalogPresentationKeys = ['meta_title','meta_description','og_image','og_image_alt'] as const;
export const catalogFields: Record<
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
    { key: "title", label: "Product name", required: true },
    { key: "slug", label: "Page address", required: true },
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
    { key: "inclusions", label: "Ticket inclusions and admission information" },
  ],
  supplier: [
    { key: "name", label: "Supplier name", required: true },
    { key: "type", label: "Supplier type", options: ["owned", "partner"] },
  ],
};

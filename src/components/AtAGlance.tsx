import { useTranslations, useLocale } from "next-intl";

/* ── Types ── */
interface GlanceItem {
  key: string;
  label_en: string;
  label_es: string;
  value_en: string;
  value_es: string;
  categoryOverride?: CategoryId;
}

/* ── Category definitions ── */
type CategoryId = "vehicle" | "living" | "electrical" | "water" | "climate" | "docs" | "other";

interface CategoryDef {
  id: CategoryId;
  name_en: string;
  name_es: string;
  icon: string; // SVG path
}

const CATEGORY_ORDER: CategoryDef[] = [
  {
    id: "vehicle",
    name_en: "Vehicle",
    name_es: "Vehículo",
    icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
  },
  {
    id: "living",
    name_en: "Living",
    name_es: "Habitabilidad",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2",
  },
  {
    id: "electrical",
    name_en: "Electrical",
    name_es: "Eléctrico",
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
  },
  {
    id: "water",
    name_en: "Water & Kitchen",
    name_es: "Agua y Cocina",
    icon: "M12 3c-4 6-8 9.5-8 13a8 8 0 0016 0c0-3.5-4-7-8-13z",
  },
  {
    id: "climate",
    name_en: "Climate",
    name_es: "Climatización",
    icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
  },
  {
    id: "docs",
    name_en: "Documentation",
    name_es: "Documentación",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "other",
    name_en: "Other",
    name_es: "Otros",
    icon: "M4 6h16M4 12h16M4 18h16",
  },
];

const ITEM_TO_CATEGORY: Record<string, CategoryId> = {
  Engine: "vehicle",
  Mileage: "vehicle",
  Transmission: "vehicle",
  Fuel: "vehicle",
  Dimensions: "vehicle",
  Length: "vehicle",
  Tires: "vehicle",
  GVW: "vehicle",
  Year: "vehicle",

  Sleeps: "living",
  Seats: "living",

  Battery: "electrical",
  Solar: "electrical",
  Inverter: "electrical",
  Starlink: "electrical",

  "Fresh Water": "water",
  "Grey Water": "water",
  "Water Heater": "water",
  Shower: "water",
  Stove: "water",

  Heating: "climate",
  Gas: "climate",

  Registration: "docs",
  Inspection: "docs",
  "Circulation Permit": "docs",
  Permit: "docs",
  Docs: "docs",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectGlanceComponents(vehicleData: any): GlanceItem[] {
  const sections = [
    vehicleData.electrical_12v,
    vehicleData.electrical_230v,
    vehicleData.plumbing,
    vehicleData.heating,
  ];

  const items: GlanceItem[] = [];
  for (const section of sections) {
    for (const comp of section.components) {
      const c = comp as {
        name: string;
        specs: string;
        show_in_glance?: boolean;
        glance_label_en?: string;
        glance_label_es?: string;
        glance_value_en?: string;
        glance_value_es?: string;
      };
      if (c.show_in_glance) {
        items.push({
          key: c.glance_label_en || c.name,
          label_en: c.glance_label_en || c.name,
          label_es: c.glance_label_es || c.name,
          value_en: c.glance_value_en || c.specs || "—",
          value_es: c.glance_value_es || c.specs || "—",
        });
      }
    }
  }
  return items;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectVehicleGlance(vehicleData: any): GlanceItem[] {
  const v = vehicleData.vehicle as Record<string, unknown>;
  const glanceFields = (v.glance_fields || {}) as Record<
    string,
    { show: boolean; label_en: string; label_es: string; value_en?: string; value_es?: string }
  >;

  const items: GlanceItem[] = [];
  for (const [key, config] of Object.entries(glanceFields)) {
    if (!config.show) continue;
    const rawValue = v[key];
    if (rawValue === undefined) continue;
    const fallback = String(rawValue);
    items.push({
      key: config.label_en || key,
      label_en: config.label_en || key,
      label_es: config.label_es || key,
      value_en: config.value_en || fallback,
      value_es: config.value_es || fallback,
    });
  }
  return items;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectCamperizationGlance(vehicleData: any): GlanceItem[] {
  const features = vehicleData.camperization.features as Array<{
    en: string;
    es: string;
    show_in_glance?: boolean;
  }>;

  return features
    .filter((f) => f.show_in_glance)
    .map((f) => ({
      key: f.en,
      label_en: f.en,
      label_es: f.es,
      value_en: "✓",
      value_es: "✓",
      categoryOverride: "living" as CategoryId,
    }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildGlanceItems(vehicleData: any): GlanceItem[] {
  const vehicleItems = collectVehicleGlance(vehicleData);
  const componentItems = collectGlanceComponents(vehicleData);
  const camperizationItems = collectCamperizationGlance(vehicleData);
  return [...vehicleItems, ...componentItems, ...camperizationItems];
}

function groupByCategory(items: GlanceItem[]): { category: CategoryDef; items: GlanceItem[] }[] {
  const buckets = new Map<CategoryId, GlanceItem[]>();

  for (const item of items) {
    const catId = item.categoryOverride || ITEM_TO_CATEGORY[item.key] || "other";
    if (!buckets.has(catId)) buckets.set(catId, []);
    buckets.get(catId)!.push(item);
  }

  return CATEGORY_ORDER
    .filter((cat) => buckets.has(cat.id))
    .map((cat) => ({ category: cat, items: buckets.get(cat.id)! }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AtAGlance({ vehicleData }: { vehicleData: any }) {
  const t = useTranslations("glance");
  const locale = useLocale();
  const items = buildGlanceItems(vehicleData);
  const groups = groupByCategory(items);

  return (
    <section id="glance" className="py-24 px-4 bg-ocean-950">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-12 text-center">
          {t("title")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(({ category, items: catItems }) => {
            const catName = locale === "es" ? category.name_es : category.name_en;
            return (
              <div
                key={category.id}
                className="bg-ocean-900/50 border border-ocean-700/30 rounded-xl p-6"
              >
                {/* Category header */}
                <div className="flex items-center gap-3 pb-3 mb-4 border-b border-ocean-700/40">
                  <svg
                    className="w-5 h-5 text-amber-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={category.icon}
                    />
                  </svg>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                    {catName}
                  </h3>
                </div>

                {/* Items list */}
                <ul className="space-y-0 divide-y divide-ocean-700/20">
                  {catItems.map((item) => {
                    const label = locale === "es" ? item.label_es : item.label_en;
                    const value = locale === "es" ? item.value_es : item.value_en;
                    return (
                      <li key={item.key} className="flex justify-between items-baseline py-2.5">
                        <span className="text-sm text-ocean-300">{label}</span>
                        <span className="text-sm font-semibold text-white text-right ml-4">
                          {value}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

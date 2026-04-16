"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/* ───────────────────── Types ───────────────────── */

interface Component {
  name: string;
  brand: string;
  model: string;
  specs: string;
  notes: string;
  image_path?: string;
  show_in_glance?: boolean;
  glance_label_en?: string;
  glance_label_es?: string;
  glance_value_en?: string;
  glance_value_es?: string;
}

interface SystemSection {
  components: Component[];
  diagram_description: string;
  diagram_image_path: string;
  freetext_notes: string;
}

interface ServiceEntry {
  date: string;
  mileage: string;
  description: string;
  provider: string;
}

interface CamperizationData {
  description_en: string;
  description_es: string;
  features: { en: string; es: string; show_in_glance?: boolean }[];
}

interface EquipmentItem {
  name_en: string;
  name_es: string;
  quantity: number;
}

interface EquipmentCategory {
  name_en: string;
  name_es: string;
  items: EquipmentItem[];
}

interface IncludedEquipmentData {
  categories: EquipmentCategory[];
}

interface ChatbotVersionEntry {
  version: number;
  date: string;
  notes: string;
}

interface ChatbotConfigData {
  model: string;
  max_tokens: number;
  current_version: number;
  prompt_template: string;
  version_history: ChatbotVersionEntry[];
}

interface DorisData {
  vehicle: Record<string, unknown>;
  story: { en: string; es: string };
  camperization: CamperizationData;
  electrical_12v: SystemSection;
  electrical_230v: SystemSection;
  plumbing: SystemSection;
  heating: SystemSection;
  included_equipment: IncludedEquipmentData;
  service_history: { entries: ServiceEntry[]; freetext_notes: string };
  quirks_and_notes: { items: string[] };
  faqs: { question: string; answer: string }[];
  chatbot_config: ChatbotConfigData;
}

/* ───────────────────── Tabs ───────────────────── */

const TABS = [
  "Vehicle",
  "Story",
  "Camperization",
  "12V Electrical",
  "230V Electrical",
  "Plumbing",
  "Heating",
  "Equipment",
  "Service History",
  "Quirks & Notes",
  "FAQs",
  "Test Chatbot",
] as const;

type TabName = (typeof TABS)[number];

/* ───────────────────── Helpers ───────────────────── */

function labelFor(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const inputClass =
  "w-full rounded border border-ocean-200 bg-white px-3 py-2 text-sm text-ocean-900 placeholder:text-ocean-300 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";

const btnClass =
  "rounded bg-ocean-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-ocean-800 transition-colors";

const btnDangerClass =
  "rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors";

/* ───────────────────── Sub-forms ───────────────────── */

interface GlanceFieldConfig {
  show: boolean;
  label_en: string;
  label_es: string;
  value_en?: string;
  value_es?: string;
}

function VehicleForm({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}) {
  const glanceFields = (data.glance_fields || {}) as Record<string, GlanceFieldConfig>;

  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === "price") {
      const p = v as { amount: number; currency: string };
      flat["price_amount"] = String(p.amount);
      flat["price_currency"] = p.currency;
    } else if (k === "glance_fields") {
      // skip — rendered separately
    } else {
      flat[k] = String(v);
    }
  }

  const set = (key: string, val: string) => {
    if (key === "price_amount") {
      onChange({
        ...data,
        price: { ...(data.price as object), amount: Number(val) || 0 },
      });
    } else if (key === "price_currency") {
      onChange({
        ...data,
        price: { ...(data.price as object), currency: val },
      });
    } else {
      const numFields = ["year", "sleeping_capacity"];
      onChange({
        ...data,
        [key]: numFields.includes(key) ? Number(val) || 0 : val,
      });
    }
  };

  const setGlance = (fieldKey: string, patch: Partial<GlanceFieldConfig>) => {
    const current = glanceFields[fieldKey] || { show: false, label_en: "", label_es: "" };
    onChange({
      ...data,
      glance_fields: { ...glanceFields, [fieldKey]: { ...current, ...patch } },
    });
  };

  // Fields eligible for "show in glance" (exclude internal/meta fields)
  const skipGlance = new Set(["name", "type", "price_amount", "price_currency"]);
  // Protected fields that can't be removed
  const protectedFields = new Set(["name", "year", "make", "model", "type", "price_amount", "price_currency"]);

  const [newFieldKey, setNewFieldKey] = useState("");

  const addField = () => {
    const key = newFieldKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || key in data || key === "glance_fields") return;
    onChange({ ...data, [key]: "" });
    setNewFieldKey("");
  };

  const removeField = (key: string) => {
    const next = { ...data };
    delete next[key];
    // also remove from glance_fields if present
    if (glanceFields[key]) {
      const gf = { ...glanceFields };
      delete gf[key];
      next.glance_fields = gf;
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {Object.entries(flat).map(([k, v]) => {
        const gf = glanceFields[k];
        const canGlance = !skipGlance.has(k);
        const canRemove = !protectedFields.has(k);
        return (
          <div
            key={k}
            className={`rounded-lg border p-4 ${gf?.show ? "border-amber-300 bg-amber-50/30" : "border-ocean-100 bg-white"}`}
          >
            <div className="flex items-end gap-2">
              <label className="flex-1">
                <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
                  {labelFor(k)}
                </span>
                <input
                  className={inputClass}
                  value={v}
                  onChange={(e) => set(k, e.target.value)}
                />
              </label>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => removeField(k)}
                  className={btnDangerClass}
                >
                  Remove
                </button>
              )}
            </div>

            {canGlance && (
              <div className="flex items-center gap-3 pt-3 mt-3 border-t border-ocean-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!gf?.show}
                    onChange={(e) => setGlance(k, { show: e.target.checked })}
                    className="h-4 w-4 rounded border-ocean-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-medium text-amber-700">
                    Show in At a Glance
                  </span>
                </label>
                {gf?.show && (
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <span className="mb-0.5 block text-xs text-ocean-500">Glance Label (EN)</span>
                        <input
                          className={inputClass}
                          placeholder={labelFor(k)}
                          value={gf.label_en || ""}
                          onChange={(e) => setGlance(k, { label_en: e.target.value })}
                        />
                      </label>
                      <label className="flex-1">
                        <span className="mb-0.5 block text-xs text-ocean-500">Glance Label (ES)</span>
                        <input
                          className={inputClass}
                          placeholder={labelFor(k)}
                          value={gf.label_es || ""}
                          onChange={(e) => setGlance(k, { label_es: e.target.value })}
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <span className="mb-0.5 block text-xs text-ocean-500">Glance Value (EN) — leave empty to use field value</span>
                        <input
                          className={inputClass}
                          placeholder={v}
                          value={gf.value_en || ""}
                          onChange={(e) => setGlance(k, { value_en: e.target.value })}
                        />
                      </label>
                      <label className="flex-1">
                        <span className="mb-0.5 block text-xs text-ocean-500">Glance Value (ES) — leave empty to use field value</span>
                        <input
                          className={inputClass}
                          placeholder={v}
                          value={gf.value_es || ""}
                          onChange={(e) => setGlance(k, { value_es: e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add new field */}
      <div className="flex items-end gap-2 pt-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
            New Field Name
          </span>
          <input
            className={inputClass}
            placeholder="e.g. roof_rack, awning..."
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addField()}
          />
        </label>
        <button type="button" onClick={addField} className={btnClass}>
          + Add Field
        </button>
      </div>
    </div>
  );
}

function StoryForm({
  data,
  onChange,
}: {
  data: { en: string; es: string };
  onChange: (d: { en: string; es: string }) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
          English
        </span>
        <textarea
          className={inputClass + " h-48 resize-y"}
          value={data.en}
          onChange={(e) => onChange({ ...data, en: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
          Spanish
        </span>
        <textarea
          className={inputClass + " h-48 resize-y"}
          value={data.es}
          onChange={(e) => onChange({ ...data, es: e.target.value })}
        />
      </label>
    </div>
  );
}

function SystemSectionForm({
  data,
  onChange,
}: {
  data: SystemSection;
  onChange: (d: SystemSection) => void;
}) {
  const updateComponent = (i: number, field: string, val: string | boolean) => {
    const next = data.components.map((c, idx) =>
      idx === i ? { ...c, [field]: val } : c
    );
    onChange({ ...data, components: next });
  };

  const addComponent = () =>
    onChange({
      ...data,
      components: [
        ...data.components,
        { name: "", brand: "", model: "", specs: "", notes: "", image_path: "", show_in_glance: false, glance_label_en: "", glance_label_es: "" },
      ],
    });

  const removeComponent = (i: number) =>
    onChange({
      ...data,
      components: data.components.filter((_, idx) => idx !== i),
    });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ocean-700 uppercase tracking-wide">
          Components
        </h3>
        <div className="space-y-4">
          {data.components.map((comp, i) => (
            <div
              key={i}
              className={`rounded-lg border p-4 space-y-2 ${comp.show_in_glance ? "border-amber-300 bg-amber-50/30" : "border-ocean-100 bg-white"}`}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(["name", "brand", "model", "specs", "notes"] as const).map(
                  (field) => (
                    <label key={field} className="block">
                      <span className="mb-0.5 block text-xs text-ocean-500">
                        {labelFor(field)}
                      </span>
                      <input
                        className={inputClass}
                        value={comp[field]}
                        onChange={(e) =>
                          updateComponent(i, field, e.target.value)
                        }
                      />
                    </label>
                  )
                )}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeComponent(i)}
                    className={btnDangerClass}
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Photo */}
              <label className="block">
                <span className="mb-0.5 block text-xs text-ocean-500">Photo (image path)</span>
                <input
                  className={inputClass}
                  placeholder="/images/components/example.jpeg"
                  value={comp.image_path || ""}
                  onChange={(e) => updateComponent(i, "image_path", e.target.value)}
                />
              </label>

              {/* At a Glance toggle */}
              <div className="flex items-center gap-3 pt-2 border-t border-ocean-100 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!comp.show_in_glance}
                    onChange={(e) =>
                      updateComponent(i, "show_in_glance", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-ocean-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-medium text-amber-700">
                    Show in At a Glance
                  </span>
                </label>
                {comp.show_in_glance && (
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <span className="mb-0.5 block text-xs text-ocean-500">Glance Label (EN)</span>
                        <input
                          className={inputClass}
                          placeholder={comp.name}
                          value={comp.glance_label_en || ""}
                          onChange={(e) =>
                            updateComponent(i, "glance_label_en", e.target.value)
                          }
                        />
                      </label>
                      <label className="flex-1">
                        <span className="mb-0.5 block text-xs text-ocean-500">Glance Label (ES)</span>
                        <input
                          className={inputClass}
                          placeholder={comp.name}
                          value={comp.glance_label_es || ""}
                          onChange={(e) =>
                            updateComponent(i, "glance_label_es", e.target.value)
                          }
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <span className="mb-0.5 block text-xs text-ocean-500">Glance Value (EN) — leave empty to use specs</span>
                        <input
                          className={inputClass}
                          placeholder={comp.specs}
                          value={comp.glance_value_en || ""}
                          onChange={(e) =>
                            updateComponent(i, "glance_value_en", e.target.value)
                          }
                        />
                      </label>
                      <label className="flex-1">
                        <span className="mb-0.5 block text-xs text-ocean-500">Glance Value (ES) — leave empty to use specs</span>
                        <input
                          className={inputClass}
                          placeholder={comp.specs}
                          value={comp.glance_value_es || ""}
                          onChange={(e) =>
                            updateComponent(i, "glance_value_es", e.target.value)
                          }
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addComponent} className={btnClass + " mt-3"}>
          + Add Component
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
          Diagram Description
        </span>
        <textarea
          className={inputClass + " h-24 resize-y"}
          value={data.diagram_description}
          onChange={(e) =>
            onChange({ ...data, diagram_description: e.target.value })
          }
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
          Diagram Image Path
        </span>
        <input
          className={inputClass}
          value={data.diagram_image_path}
          onChange={(e) =>
            onChange({ ...data, diagram_image_path: e.target.value })
          }
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
          Notes
        </span>
        <textarea
          className={inputClass + " h-32 resize-y"}
          value={data.freetext_notes}
          onChange={(e) =>
            onChange({ ...data, freetext_notes: e.target.value })
          }
        />
      </label>
    </div>
  );
}

function ServiceHistoryForm({
  data,
  onChange,
}: {
  data: { entries: ServiceEntry[]; freetext_notes: string };
  onChange: (d: { entries: ServiceEntry[]; freetext_notes: string }) => void;
}) {
  const updateEntry = (i: number, field: keyof ServiceEntry, val: string) => {
    const next = data.entries.map((e, idx) =>
      idx === i ? { ...e, [field]: val } : e
    );
    onChange({ ...data, entries: next });
  };

  const addEntry = () =>
    onChange({
      ...data,
      entries: [
        ...data.entries,
        { date: "", mileage: "", description: "", provider: "" },
      ],
    });

  const removeEntry = (i: number) =>
    onChange({
      ...data,
      entries: data.entries.filter((_, idx) => idx !== i),
    });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ocean-700 uppercase tracking-wide">
          Entries
        </h3>
        <div className="space-y-4">
          {data.entries.map((entry, i) => (
            <div
              key={i}
              className="rounded-lg border border-ocean-100 bg-white p-4"
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["date", "mileage", "description", "provider"] as const).map(
                  (field) => (
                    <label key={field} className="block">
                      <span className="mb-0.5 block text-xs text-ocean-500">
                        {labelFor(field)}
                      </span>
                      <input
                        className={inputClass}
                        value={entry[field]}
                        onChange={(e) =>
                          updateEntry(i, field, e.target.value)
                        }
                      />
                    </label>
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => removeEntry(i)}
                className={btnDangerClass + " mt-2"}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addEntry} className={btnClass + " mt-3"}>
          + Add Entry
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
          Notes
        </span>
        <textarea
          className={inputClass + " h-32 resize-y"}
          value={data.freetext_notes}
          onChange={(e) =>
            onChange({ ...data, freetext_notes: e.target.value })
          }
        />
      </label>
    </div>
  );
}

function QuirksForm({
  data,
  onChange,
}: {
  data: { items: string[] };
  onChange: (d: { items: string[] }) => void;
}) {
  const update = (i: number, val: string) => {
    const next = data.items.map((item, idx) => (idx === i ? val : item));
    onChange({ items: next });
  };

  const add = () => onChange({ items: [...data.items, ""] });

  const remove = (i: number) =>
    onChange({ items: data.items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {data.items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <textarea
            className={inputClass + " flex-1 h-20 resize-y"}
            value={item}
            onChange={(e) => update(i, e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className={btnDangerClass + " self-start"}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className={btnClass}>
        + Add Item
      </button>
    </div>
  );
}

function CamperizationForm({
  data,
  onChange,
}: {
  data: CamperizationData;
  onChange: (d: CamperizationData) => void;
}) {
  const updateFeature = (i: number, lang: "en" | "es", val: string) => {
    const next = data.features.map((f, idx) =>
      idx === i ? { ...f, [lang]: val } : f
    );
    onChange({ ...data, features: next });
  };

  const toggleGlance = (i: number) => {
    const next = data.features.map((f, idx) =>
      idx === i ? { ...f, show_in_glance: !f.show_in_glance } : f
    );
    onChange({ ...data, features: next });
  };

  const addFeature = () =>
    onChange({ ...data, features: [...data.features, { en: "", es: "", show_in_glance: false }] });

  const removeFeature = (i: number) =>
    onChange({ ...data, features: data.features.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
          Description (English)
        </span>
        <textarea
          className={inputClass + " h-32 resize-y"}
          value={data.description_en}
          onChange={(e) => onChange({ ...data, description_en: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
          Description (Spanish)
        </span>
        <textarea
          className={inputClass + " h-32 resize-y"}
          value={data.description_es}
          onChange={(e) => onChange({ ...data, description_es: e.target.value })}
        />
      </label>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ocean-700 uppercase tracking-wide">
          Features
        </h3>
        <div className="space-y-3">
          {data.features.map((feat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="mb-1 block text-xs text-ocean-500">English</span>
                  <input
                    className={inputClass}
                    value={feat.en}
                    onChange={(e) => updateFeature(i, "en", e.target.value)}
                  />
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-xs text-ocean-500">Spanish</span>
                  <input
                    className={inputClass}
                    value={feat.es}
                    onChange={(e) => updateFeature(i, "es", e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className={btnDangerClass}
                >
                  Remove
                </button>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!feat.show_in_glance}
                  onChange={() => toggleGlance(i)}
                  className="rounded border-ocean-300 text-ocean-600 focus:ring-ocean-500"
                />
                <span className="text-xs text-ocean-500">Show in At a Glance (Living)</span>
              </label>
            </div>
          ))}
        </div>
        <button type="button" onClick={addFeature} className={btnClass + " mt-3"}>
          + Add Feature
        </button>
      </div>
    </div>
  );
}

function EquipmentForm({
  data,
  onChange,
}: {
  data: IncludedEquipmentData;
  onChange: (d: IncludedEquipmentData) => void;
}) {
  const updateCategory = (i: number, field: "name_en" | "name_es", val: string) => {
    const next = data.categories.map((cat, idx) =>
      idx === i ? { ...cat, [field]: val } : cat
    );
    onChange({ categories: next });
  };

  const addCategory = () =>
    onChange({
      categories: [
        ...data.categories,
        { name_en: "", name_es: "", items: [] },
      ],
    });

  const removeCategory = (i: number) =>
    onChange({ categories: data.categories.filter((_, idx) => idx !== i) });

  const updateItem = (
    catIdx: number,
    itemIdx: number,
    field: keyof EquipmentItem,
    val: string
  ) => {
    const next = data.categories.map((cat, ci) =>
      ci === catIdx
        ? {
            ...cat,
            items: cat.items.map((item, ii) =>
              ii === itemIdx
                ? {
                    ...item,
                    [field]: field === "quantity" ? Number(val) || 0 : val,
                  }
                : item
            ),
          }
        : cat
    );
    onChange({ categories: next });
  };

  const addItem = (catIdx: number) => {
    const next = data.categories.map((cat, ci) =>
      ci === catIdx
        ? {
            ...cat,
            items: [
              ...cat.items,
              { name_en: "", name_es: "", quantity: 1 },
            ],
          }
        : cat
    );
    onChange({ categories: next });
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    const next = data.categories.map((cat, ci) =>
      ci === catIdx
        ? { ...cat, items: cat.items.filter((_, ii) => ii !== itemIdx) }
        : cat
    );
    onChange({ categories: next });
  };

  return (
    <div className="space-y-6">
      {data.categories.map((cat, ci) => (
        <div
          key={ci}
          className="rounded-lg border border-ocean-100 bg-white p-4 space-y-4"
        >
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ocean-500">
                Category Name (EN)
              </span>
              <input
                className={inputClass}
                value={cat.name_en}
                onChange={(e) => updateCategory(ci, "name_en", e.target.value)}
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs text-ocean-500">
                Category Name (ES)
              </span>
              <input
                className={inputClass}
                value={cat.name_es}
                onChange={(e) => updateCategory(ci, "name_es", e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() => removeCategory(ci)}
              className={btnDangerClass}
            >
              Remove Category
            </button>
          </div>

          <div className="ml-4 space-y-2">
            <h4 className="text-xs font-semibold text-ocean-600 uppercase tracking-wide">
              Items
            </h4>
            {cat.items.map((item, ii) => (
              <div key={ii} className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="mb-0.5 block text-xs text-ocean-500">
                    Name (EN)
                  </span>
                  <input
                    className={inputClass}
                    value={item.name_en}
                    onChange={(e) =>
                      updateItem(ci, ii, "name_en", e.target.value)
                    }
                  />
                </label>
                <label className="flex-1">
                  <span className="mb-0.5 block text-xs text-ocean-500">
                    Name (ES)
                  </span>
                  <input
                    className={inputClass}
                    value={item.name_es}
                    onChange={(e) =>
                      updateItem(ci, ii, "name_es", e.target.value)
                    }
                  />
                </label>
                <label className="w-20">
                  <span className="mb-0.5 block text-xs text-ocean-500">Qty</span>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(ci, ii, "quantity", e.target.value)
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeItem(ci, ii)}
                  className={btnDangerClass}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem(ci)}
              className={btnClass}
            >
              + Add Item
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addCategory} className={btnClass}>
        + Add Category
      </button>
    </div>
  );
}

function FaqsForm({
  data,
  onChange,
}: {
  data: { question: string; answer: string }[];
  onChange: (d: { question: string; answer: string }[]) => void;
}) {
  const update = (i: number, field: "question" | "answer", val: string) => {
    const next = data.map((faq, idx) =>
      idx === i ? { ...faq, [field]: val } : faq
    );
    onChange(next);
  };

  const add = () => onChange([...data, { question: "", answer: "" }]);

  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <p className="text-sm text-ocean-500">
        {data.length} FAQ{data.length !== 1 ? "s" : ""}
      </p>
      {data.map((faq, i) => (
        <div
          key={i}
          className="rounded-lg border border-ocean-100 bg-white p-4 space-y-2"
        >
          <div className="flex items-start gap-2">
            <span className="mt-2 text-xs font-bold text-ocean-400 w-8 flex-shrink-0">
              #{i + 1}
            </span>
            <div className="flex-1 space-y-2">
              <label className="block">
                <span className="mb-0.5 block text-xs font-medium text-ocean-600">
                  Question
                </span>
                <input
                  className={inputClass}
                  value={faq.question}
                  onChange={(e) => update(i, "question", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-xs font-medium text-ocean-600">
                  Answer
                </span>
                <textarea
                  className={inputClass + " h-20 resize-y"}
                  value={faq.answer}
                  onChange={(e) => update(i, "answer", e.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className={btnDangerClass + " mt-6 flex-shrink-0"}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className={btnClass}>
        + Add FAQ
      </button>
    </div>
  );
}

/* ───────────────────── Test Chatbot Form ───────────────────── */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function TestChatbotForm({
  data,
  onChange,
  onSaveAndBump,
  fullData,
}: {
  data: ChatbotConfigData;
  onChange: (d: ChatbotConfigData) => void;
  onSaveAndBump: () => void;
  fullData: DorisData;
}) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const sendTestMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const body = await res.json();
      if (body.error) throw new Error(body.error);
      setChatMessages([...updated, { role: "assistant", content: body.message }]);
    } catch (e: unknown) {
      setChatMessages([
        ...updated,
        { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Failed to get response"}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Prompt Config */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ocean-700 uppercase tracking-wide">
            System Prompt (v{data.current_version})
          </h3>
          <button
            type="button"
            onClick={onSaveAndBump}
            className="rounded bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Save & Bump Version
          </button>
        </div>
        <textarea
          className={inputClass + " h-72 resize-y font-mono text-xs"}
          value={data.prompt_template}
          onChange={(e) => onChange({ ...data, prompt_template: e.target.value })}
        />
        <div className="flex items-center gap-3">
          <p className="text-xs text-ocean-400">
            Use <code className="bg-ocean-100 px-1 rounded">{"{{VEHICLE_DATA}}"}</code> as a placeholder — it will be replaced with the full JSON data at runtime.
          </p>
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className="text-xs font-medium text-amber-600 hover:text-amber-700 whitespace-nowrap"
          >
            {showResolved ? "Hide" : "Show"} resolved prompt
          </button>
        </div>

        {showResolved && (() => {
          const dataForPrompt = Object.fromEntries(
            Object.entries(fullData).filter(([k]) => k !== "chatbot_config")
          );
          const resolved = data.prompt_template.replace(
            "{{VEHICLE_DATA}}",
            JSON.stringify(dataForPrompt, null, 2)
          );
          return (
            <div className="rounded-lg border border-ocean-200 bg-ocean-50 p-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ocean-600 uppercase tracking-wide">
                  Resolved Prompt Preview
                </span>
                <span className="text-xs text-ocean-400">
                  {resolved.length.toLocaleString()} chars
                </span>
              </div>
              <pre className="text-xs font-mono text-ocean-700 whitespace-pre-wrap break-words">
                {resolved}
              </pre>
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
              Model
            </span>
            <input
              className={inputClass}
              value={data.model}
              onChange={(e) => onChange({ ...data, model: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ocean-600 uppercase tracking-wide">
              Max Tokens
            </span>
            <input
              type="number"
              className={inputClass}
              value={data.max_tokens}
              onChange={(e) => onChange({ ...data, max_tokens: Number(e.target.value) || 512 })}
            />
          </label>
        </div>
      </div>

      {/* Version History */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ocean-700 uppercase tracking-wide">
          Version History
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {[...data.version_history].reverse().map((entry) => (
            <div
              key={entry.version}
              className={`rounded-lg border p-3 text-sm ${
                entry.version === data.current_version
                  ? "border-amber-300 bg-amber-50/30"
                  : "border-ocean-100 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-ocean-700">v{entry.version}</span>
                <span className="text-ocean-400">{entry.date}</span>
                {entry.version === data.current_version && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    current
                  </span>
                )}
              </div>
              <p className="mt-1 text-ocean-500">{entry.notes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Test Chat */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-ocean-700 uppercase tracking-wide">
            Test Chat
          </h3>
          <button
            type="button"
            onClick={() => setChatMessages([])}
            className="text-xs text-ocean-400 hover:text-ocean-600"
          >
            Clear conversation
          </button>
        </div>
        <div className="rounded-lg border border-ocean-200 bg-white overflow-hidden">
          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-center text-sm text-ocean-300 mt-12">
                Send a message to test the chatbot with the current prompt.
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-ocean-700 text-white"
                      : "bg-ocean-50 text-ocean-800 border border-ocean-100"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-ocean-50 border border-ocean-100 rounded-xl px-4 py-2 text-sm text-ocean-400">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-ocean-100 p-3 flex gap-2">
            <input
              className={inputClass + " flex-1"}
              placeholder="Type a test message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendTestMessage();
                }
              }}
            />
            <button
              type="button"
              onClick={sendTestMessage}
              disabled={chatLoading || !chatInput.trim()}
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                chatLoading || !chatInput.trim()
                  ? "bg-ocean-300 cursor-not-allowed"
                  : "bg-ocean-700 hover:bg-ocean-800"
              }`}
            >
              Send
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-ocean-400">
          Note: The test chat uses the <strong>saved</strong> prompt from doris.json. Save changes first to test prompt edits.
        </p>
      </div>
    </div>
  );
}

/* ───────────────────── Main Page ───────────────────── */

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function AdminPage() {
  const [data, setData] = useState<DorisData | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Vehicle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setError("Failed to load data"));
  }, []);

  const save = useCallback(async () => {
    if (!data) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = "Save failed";
        try { message = JSON.parse(text).error || message; } catch { /* empty body */ }
        throw new Error(message);
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e: unknown) {
      setSaveStatus("error");
      setError(e instanceof Error ? e.message : "Save failed");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [data]);

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite">
        <p className="text-ocean-500">Loading...</p>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "Vehicle":
        return (
          <VehicleForm
            data={data.vehicle}
            onChange={(v) => setData({ ...data, vehicle: v })}
          />
        );
      case "Story":
        return (
          <StoryForm
            data={data.story}
            onChange={(s) => setData({ ...data, story: s })}
          />
        );
      case "Camperization":
        return (
          <CamperizationForm
            data={data.camperization}
            onChange={(d) => setData({ ...data, camperization: d })}
          />
        );
      case "12V Electrical":
        return (
          <SystemSectionForm
            data={data.electrical_12v}
            onChange={(d) => setData({ ...data, electrical_12v: d })}
          />
        );
      case "230V Electrical":
        return (
          <SystemSectionForm
            data={data.electrical_230v}
            onChange={(d) => setData({ ...data, electrical_230v: d })}
          />
        );
      case "Plumbing":
        return (
          <SystemSectionForm
            data={data.plumbing}
            onChange={(d) => setData({ ...data, plumbing: d })}
          />
        );
      case "Heating":
        return (
          <SystemSectionForm
            data={data.heating}
            onChange={(d) => setData({ ...data, heating: d })}
          />
        );
      case "Equipment":
        return (
          <EquipmentForm
            data={data.included_equipment}
            onChange={(d) => setData({ ...data, included_equipment: d })}
          />
        );
      case "Service History":
        return (
          <ServiceHistoryForm
            data={data.service_history}
            onChange={(d) => setData({ ...data, service_history: d })}
          />
        );
      case "Quirks & Notes":
        return (
          <QuirksForm
            data={data.quirks_and_notes}
            onChange={(d) => setData({ ...data, quirks_and_notes: d })}
          />
        );
      case "FAQs":
        return (
          <FaqsForm
            data={data.faqs}
            onChange={(d) => setData({ ...data, faqs: d })}
          />
        );
      case "Test Chatbot":
        return (
          <TestChatbotForm
            data={data.chatbot_config}
            onChange={(d) => setData({ ...data, chatbot_config: d })}
            fullData={data}
            onSaveAndBump={async () => {
              if (!data) return;
              const nextVersion = data.chatbot_config.current_version + 1;
              const today = new Date().toISOString().slice(0, 10);
              const notes = prompt("Version notes:") || `Version ${nextVersion}`;
              const updated = {
                ...data,
                chatbot_config: {
                  ...data.chatbot_config,
                  current_version: nextVersion,
                  version_history: [
                    ...data.chatbot_config.version_history,
                    { version: nextVersion, date: today, notes },
                  ],
                },
              };
              setData(updated);
              // Auto-save
              try {
                const res = await fetch("/api/admin", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(updated),
                });
                if (!res.ok) throw new Error("Save failed");
                setSaveStatus("saved");
                setTimeout(() => setSaveStatus("idle"), 2000);
              } catch {
                setSaveStatus("error");
                setError("Failed to save version bump");
                setTimeout(() => setSaveStatus("idle"), 3000);
              }
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-offwhite font-body">
      {/* Header */}
      <header className="border-b border-ocean-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold text-ocean-900">
            Doris Admin
          </h1>
          <a
            href="/"
            className="text-sm text-ocean-500 hover:text-ocean-700 underline"
          >
            Back to site
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Tabs */}
        <nav className="mb-6 flex flex-wrap gap-1 rounded-lg border border-ocean-100 bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-ocean-700 text-white"
                  : "text-ocean-600 hover:bg-ocean-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Active tab content */}
        <div className="rounded-lg border border-ocean-100 bg-ocean-50/30 p-6">
          <h2 className="mb-4 text-lg font-heading font-semibold text-ocean-800">
            {activeTab}
          </h2>
          {renderTab()}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 border-t border-ocean-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-end gap-3">
          {saveStatus === "error" && (
            <span className="text-sm text-red-600">{error}</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-sm text-green-600">Saved successfully</span>
          )}
          <button
            onClick={save}
            disabled={saveStatus === "saving"}
            className={`rounded-lg px-6 py-2 text-sm font-semibold text-white transition-colors ${
              saveStatus === "saving"
                ? "bg-ocean-400 cursor-not-allowed"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

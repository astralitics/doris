"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";
import SystemTab from "./SystemTab";

const tabs = [
  { key: "tab_camperization", id: "camperization" },
  { key: "tab_12v", id: "12v" },
  { key: "tab_230v", id: "230v" },
  { key: "tab_plumbing", id: "plumbing" },
  { key: "tab_heating", id: "heating" },
  { key: "tab_service", id: "service" },
] as const;

type SystemData = {
  components: Array<{
    name: string;
    brand: string;
    model: string;
    specs: string;
    notes: string;
  }>;
  diagram_description: string;
  diagram_image_path: string;
  freetext_notes: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SystemsDocs({ vehicleData }: { vehicleData: any }) {
  const t = useTranslations("systems");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState("camperization");

  function getSystemData(): {
    system: SystemData | null;
    serviceHistory: typeof vehicleData.service_history | null;
  } {
    switch (activeTab) {
      case "camperization":
        return { system: null, serviceHistory: null };
      case "12v":
        return { system: vehicleData.electrical_12v, serviceHistory: null };
      case "230v":
        return { system: vehicleData.electrical_230v, serviceHistory: null };
      case "plumbing":
        return { system: vehicleData.plumbing, serviceHistory: null };
      case "heating":
        return { system: vehicleData.heating, serviceHistory: null };
      case "service":
        return { system: null, serviceHistory: vehicleData.service_history };
      default:
        return { system: null, serviceHistory: null };
    }
  }

  const { system, serviceHistory } = getSystemData();

  return (
    <section id="systems" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-ocean-900 mb-2 text-center">
          {t("title")}
        </h2>
        <p className="text-ocean-600 text-center mb-12 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>

        {/* Tab buttons — horizontal scroll on mobile */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-5 py-3 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-ocean-700 text-white"
                  : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
              }`}
            >
              {t(tab.key)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "camperization" && (
          <div className="bg-white rounded-2xl border border-ocean-100 p-6 md:p-8">
            <p className="text-ocean-700 leading-relaxed mb-6 whitespace-pre-line">
              {locale === "es"
                ? vehicleData.camperization.description_es
                : vehicleData.camperization.description_en}
            </p>
            <ul className="space-y-3">
              {vehicleData.camperization.features.map((feat: { en: string; es: string }, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-ocean-700 text-sm leading-relaxed">
                    {locale === "es" ? feat.es : feat.en}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {system && <SystemTab system={system} />}

        {serviceHistory && (
          <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ocean-50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium text-ocean-700">
                      {t("service_date")}
                    </th>
                    <th className="text-left px-6 py-4 font-medium text-ocean-700">
                      {t("service_mileage")}
                    </th>
                    <th className="text-left px-6 py-4 font-medium text-ocean-700">
                      {t("service_description")}
                    </th>
                    <th className="text-left px-6 py-4 font-medium text-ocean-700">
                      {t("service_provider")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ocean-50">
                  {serviceHistory.entries.map((entry: { date: string; mileage: string; description: string; provider: string }, i: number) => (
                    <tr key={i} className="hover:bg-ocean-50/50">
                      <td className="px-6 py-4 text-ocean-600">
                        {entry.date}
                      </td>
                      <td className="px-6 py-4 text-ocean-600">
                        {entry.mileage}
                      </td>
                      <td className="px-6 py-4 text-ocean-800">
                        {entry.description}
                      </td>
                      <td className="px-6 py-4 text-ocean-600">
                        {entry.provider}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {serviceHistory.freetext_notes && (
              <div className="px-6 py-5 bg-ocean-50/50 border-t border-ocean-100">
                <h4 className="font-medium text-ocean-700 mb-2">
                  {t("notes_title")}
                </h4>
                <p className="text-ocean-600 text-sm leading-relaxed">
                  {serviceHistory.freetext_notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

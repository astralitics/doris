import { useTranslations } from "next-intl";
import Image from "next/image";

interface ComponentTableProps {
  components: Array<{
    name: string;
    brand: string;
    model: string;
    specs: string;
    notes: string;
    image_path?: string;
  }>;
}

export default function ComponentTable({ components }: ComponentTableProps) {
  const t = useTranslations("systems");

  return (
    <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50">
            <tr>
              <th className="text-left px-6 py-4 font-medium text-ocean-700">
                {t("table_component")}
              </th>
              <th className="text-left px-6 py-4 font-medium text-ocean-700">
                {t("table_brand")}
              </th>
              <th className="text-left px-6 py-4 font-medium text-ocean-700">
                {t("table_specs")}
              </th>
              <th className="text-left px-6 py-4 font-medium text-ocean-700 hidden md:table-cell">
                {t("table_notes")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-50">
            {components.map((comp, i) => (
              <tr key={i} className="hover:bg-ocean-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {comp.image_path && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-ocean-100">
                        <Image
                          src={comp.image_path}
                          alt={comp.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <span className="font-medium text-ocean-800">{comp.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-ocean-600">
                  {comp.brand !== "TBD"
                    ? `${comp.brand} ${comp.model}`
                    : "TBD"}
                </td>
                <td className="px-6 py-4 text-ocean-600">{comp.specs}</td>
                <td className="px-6 py-4 text-ocean-500 text-xs hidden md:table-cell">
                  {comp.notes || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useTranslations } from "next-intl";
import ComponentTable from "./ComponentTable";
import DiagramViewer from "./DiagramViewer";

interface SystemTabProps {
  system: {
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
}

export default function SystemTab({ system }: SystemTabProps) {
  const t = useTranslations("systems");

  return (
    <div className="space-y-8">
      <ComponentTable components={system.components} />

      <div className="bg-ocean-950 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-ocean-800">
          <h3 className="font-medium text-white">{t("diagram_title")}</h3>
        </div>
        <DiagramViewer
          description={system.diagram_description}
          imagePath={system.diagram_image_path}
        />
      </div>

      {system.freetext_notes && (
        <div className="bg-white rounded-2xl border border-ocean-100 px-6 py-5">
          <h4 className="font-medium text-ocean-700 mb-2">
            {t("notes_title")}
          </h4>
          <p className="text-ocean-600 text-sm leading-relaxed">
            {system.freetext_notes}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

interface DiagramViewerProps {
  description: string;
  imagePath: string;
}

export default function DiagramViewer({
  description,
  imagePath,
}: DiagramViewerProps) {
  const t = useTranslations("systems");
  const hasImage = imagePath && !imagePath.includes("placeholder");

  return (
    <div className="p-6">
      <div className="relative aspect-[16/9] bg-ocean-900 rounded-xl overflow-hidden border border-ocean-700/30">
        {hasImage ? (
          <Image
            src={imagePath}
            alt={description}
            fill
            className="object-contain p-4"
            sizes="(max-width: 768px) 100vw, 800px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center px-8">
            <div>
              <svg
                className="w-16 h-16 text-ocean-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              <p className="text-ocean-400 text-sm max-w-lg mx-auto leading-relaxed">
                {description}
              </p>
              <p className="text-ocean-600 text-xs mt-4">
                {t("diagram_coming_soon")}{" "}
                <code className="bg-ocean-800 px-2 py-1 rounded">{imagePath}</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

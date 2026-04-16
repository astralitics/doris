import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Story({ vehicleData }: { vehicleData: any }) {
  const t = useTranslations("story");
  const locale = useLocale();
  const story = locale === "es" ? vehicleData.story.es : vehicleData.story.en;
  const paragraphs = story.split("\n\n");

  return (
    <section id="story" className="py-24 px-4 bg-ocean-50/60">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-ocean-900 mb-2">
          {t("title")}
        </h2>
        <p className="text-lg text-amber-600 font-medium mb-10">
          {t("subtitle")}
        </p>

        <div className="space-y-6">
          {paragraphs.map((p: string, i: number) => (
            <p
              key={i}
              className="text-lg leading-relaxed text-ocean-800/80"
            >
              {p}
            </p>
          ))}
        </div>

        <div className="relative mt-10 overflow-hidden rounded-2xl shadow-lg mx-auto">
          <Image
            src="/images/exterior/night-1.jpg"
            alt="Doris at night"
            width={1200}
            height={700}
            className="w-full h-auto object-cover"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWEzNTJjIi8+PC9zdmc+"
          />
        </div>
      </div>
    </section>
  );
}

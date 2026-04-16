"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState, useMemo, useEffect, useCallback } from "react";

import type { GalleryImage } from "@/lib/images";

const FILTERS = ["all", "interior", "exterior", "adventures"] as const;
type Filter = (typeof FILTERS)[number];

export default function Gallery({ images }: { images: GalleryImage[] }) {
  const t = useTranslations("gallery");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? images : images.filter((img) => img.category === filter)),
    [filter, images]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selected === null) return;
      if (e.key === "ArrowLeft") setSelected((selected - 1 + filtered.length) % filtered.length);
      else if (e.key === "ArrowRight") setSelected((selected + 1) % filtered.length);
      else if (e.key === "Escape") setSelected(null);
    },
    [selected, filtered.length]
  );

  useEffect(() => {
    if (selected !== null) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [selected, handleKeyDown]);

  return (
    <section id="gallery" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-4xl md:text-5xl font-bold text-ocean-900 mb-2">
          {t("title")}
        </h2>
        <p className="text-lg text-amber-600 font-medium mb-8">
          {t("subtitle")}
        </p>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-ocean-700 text-white"
                  : "bg-ocean-50 text-ocean-600 hover:bg-ocean-100"
              }`}
            >
              {t(f)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((img, i) => (
            <button
              key={img.src}
              onClick={() => setSelected(i)}
              className="relative aspect-[4/3] overflow-hidden rounded-xl group cursor-pointer"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
                loading={i < 6 ? "eager" : "lazy"}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWEzNTJjIi8+PC9zdmc+"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            onClick={() => setSelected(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setSelected((selected - 1 + filtered.length) % filtered.length); }}
            className="absolute left-4 text-white/70 hover:text-white p-2"
            aria-label="Previous"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected((selected + 1) % filtered.length); }}
            className="absolute right-4 text-white/70 hover:text-white p-2"
            aria-label="Next"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="relative max-w-4xl max-h-[80vh] w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={filtered[selected].src}
              alt={filtered[selected].alt}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>
        </div>
      )}
    </section>
  );
}

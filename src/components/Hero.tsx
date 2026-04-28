"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import ContactModal from "./ContactModal";
import HeroChat from "./HeroChat";
import { Seller } from "@/lib/seller";

interface HeroPrice {
  amount?: number;
  currency?: string;
}

function formatPrice(price: HeroPrice | undefined, locale: string): string | null {
  if (!price?.amount || !price.currency) return null;
  // Spanish: $19.800.000 ; English: $19,800,000
  const localeTag = locale === "es" ? "es-CL" : "en-US";
  const formatted = price.amount.toLocaleString(localeTag);
  return `${price.currency} $${formatted}`;
}

export default function Hero({
  images,
  seller,
  price,
  tagline,
}: {
  images: string[];
  seller?: Seller;
  price?: HeroPrice;
  tagline?: string;
}) {
  const heroImages = images;
  const t = useTranslations("hero");
  const locale = useLocale();
  const formattedPrice = formatPrice(price, locale);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [showPrice, setShowPrice] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-950" />
      {heroImages.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url('${src}')`,
            opacity: i === currentImage ? 0.4 : 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-ocean-950/90 via-ocean-950/40 to-ocean-950/60" />

      <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
        <h1 className="font-heading text-6xl md:text-8xl font-black text-white mb-4 tracking-tight">
          Doris
        </h1>
        <p className="text-lg md:text-xl text-ocean-200 mb-2">
          {tagline ?? t("tagline")}
        </p>
        {showPrice && formattedPrice ? (
          <p className="text-3xl md:text-4xl font-heading font-bold text-amber-400 mb-6 animate-fade-in">
            {formattedPrice}
          </p>
        ) : formattedPrice ? (
          <button
            onClick={() => setShowPrice(true)}
            className="mb-6 px-5 py-2 text-sm font-medium text-amber-400 border border-amber-400/40 rounded-full hover:bg-amber-400/10 transition-colors"
          >
            {t("see_price")}
          </button>
        ) : null}

        {/* Prominent AI Chatbot */}
        <HeroChat />

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <a
            href="#story"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-ocean-900 font-semibold rounded-full hover:bg-ocean-50 transition-colors"
          >
            {t("cta_explore")}
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </a>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
          >
            {t("cta_contact")}
          </button>
        </div>
      </div>

      <ContactModal open={modalOpen} onClose={() => setModalOpen(false)} seller={seller} />
    </section>
  );
}

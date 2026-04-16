"use client";

import { useTranslations, useLocale } from "next-intl";
import { useState } from "react";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sections = [
    { key: "gallery", href: "#gallery" },
    { key: "specs", href: "#glance" },
    { key: "systems", href: "#systems" },
    { key: "story", href: "#story" },
    { key: "contact", href: "#contact" },
  ] as const;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-offwhite/90 backdrop-blur-md border-b border-ocean-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a
          href="#"
          className="font-heading text-2xl font-bold text-ocean-800"
        >
          Doris
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {sections.map((s) => (
            <a
              key={s.key}
              href={s.href}
              className="text-sm font-medium text-ocean-700 hover:text-ocean-900 transition-colors"
            >
              {t(s.key)}
            </a>
          ))}

          <div className="flex items-center gap-1 ml-4 bg-ocean-50 rounded-full p-1">
            <a
              href="/en"
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                locale === "en"
                  ? "bg-ocean-600 text-white"
                  : "text-ocean-700 hover:bg-ocean-100"
              }`}
            >
              EN
            </a>
            <a
              href="/es"
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                locale === "es"
                  ? "bg-ocean-600 text-white"
                  : "text-ocean-700 hover:bg-ocean-100"
              }`}
            >
              ES
            </a>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <svg
            className="w-6 h-6 text-ocean-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-offwhite border-b border-ocean-100 pb-4">
          {sections.map((s) => (
            <a
              key={s.key}
              href={s.href}
              onClick={() => setMobileOpen(false)}
              className="block px-6 py-3 text-sm font-medium text-ocean-700 hover:bg-ocean-50"
            >
              {t(s.key)}
            </a>
          ))}
          <div className="flex gap-2 px-6 pt-2">
            <a
              href="/en"
              onClick={() => setMobileOpen(false)}
              className={`text-xs px-4 py-2 rounded-full ${
                locale === "en"
                  ? "bg-ocean-600 text-white"
                  : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
              }`}
            >
              English
            </a>
            <a
              href="/es"
              onClick={() => setMobileOpen(false)}
              className={`text-xs px-4 py-2 rounded-full ${
                locale === "es"
                  ? "bg-ocean-600 text-white"
                  : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
              }`}
            >
              Español
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}

import fs from "fs";
import path from "path";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function altFromFilename(filename: string): string {
  const name = path.parse(filename).name;
  return name
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function scanFolder(folder: string): { src: string; alt: string }[] {
  const dir = path.join(process.cwd(), "public", "images", folder);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => ({
      src: `/images/${folder}/${f}`,
      alt: altFromFilename(f),
    }));
}

export function getHeroImages(): string[] {
  return scanFolder("hero").map((img) => img.src);
}

export type GalleryImage = {
  src: string;
  alt: string;
  category: "interior" | "exterior" | "adventures";
};

export function getGalleryImages(): GalleryImage[] {
  const categories = ["exterior", "adventures", "interior"] as const;
  return categories.flatMap((cat) =>
    scanFolder(cat).map((img) => ({ ...img, category: cat }))
  );
}

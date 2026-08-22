import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type BannerRow = {
  Bannerkey: string;
  Title: string | null;
  Subtitle: string | null;
  ImagePath: string;
  LinkUrl: string | null;
  ButtonText: string | null;
  Placement: string;
  SortOrder: string | number;
  IsActive: string | number;
};

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  image: string;
  linkUrl: string;
  buttonText: string;
};

const AUTO_SCROLL_MS = 4500;

export function HeroBanner() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    apiGet<BannerRow[]>("/api/banners.php")
      .then((rows) => {
        const active = rows
          .filter((r) => r.Placement === "home" && Number(r.IsActive) === 1)
          .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder))
          .map((r) => ({
            key: r.Bannerkey,
            title: r.Title ?? "",
            subtitle: r.Subtitle ?? "",
            image: r.ImagePath,
            linkUrl: r.LinkUrl || "/categories",
            buttonText: r.ButtonText || "Shop Now",
          }));
        setSlides(active);
      })
      .catch(() => setSlides([]));
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_SCROLL_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-soft)]">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s) => (
          <a key={s.key} href={s.linkUrl} className="relative aspect-[4/3] w-full shrink-0">
            <img
              src={s.image}
              alt={s.title || "Banner"}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {(s.title || s.subtitle) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 pt-10">
                {s.title && (
                  <h2 className="font-display text-2xl font-semibold text-white">{s.title}</h2>
                )}
                {s.subtitle && <p className="mt-1 text-sm text-white/85">{s.subtitle}</p>}
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-primary">
                  {s.buttonText} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            )}
          </a>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 bg-card py-2.5">
          {slides.map((s, i) => (
            <button
              key={s.key}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-5 bg-primary" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

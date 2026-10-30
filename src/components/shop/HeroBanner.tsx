import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  image: string;
  linkUrl: string;
};

const AUTO_SCROLL_MS = 4000;

export function HeroBanner() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    apiGet<BannerRow[]>("/api/banners.php")
      .then((rows) => {
        const active = rows
          .filter((r) => r.Placement === "home" && Number(r.IsActive) === 1)
          .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder))
          .map((r) => ({
            key: r.Bannerkey,
            title: r.Title ?? "",
            image: r.ImagePath,
            linkUrl: r.LinkUrl || "/categories",
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

  const go = (d: number) => setIndex((i) => (i + d + slides.length) % slides.length);
  const multi = slides.length > 1;

  return (
    <div
      className="group relative mx-auto w-full max-w-[1200px] overflow-hidden rounded-lg bg-white shadow-[0_2px_10px_rgba(45,37,37,0.10)] md:rounded-2xl"
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        const end = e.changedTouches[0]?.clientX;
        if (!multi || start === null || end === undefined) return;
        if (Math.abs(end - start) > 40) go(end < start ? 1 : -1);
      }}
    >
      <div className="relative aspect-[3/1] w-full">
        {slides.map((s, i) => (
          <a
            key={s.key}
            href={s.linkUrl}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <img
              src={s.image}
              alt={s.title || "Banner"}
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
              className="h-full w-full object-cover object-center"
            />
          </a>
        ))}
      </div>

      {multi && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="absolute left-0 top-1/2 hidden h-16 w-9 -translate-y-1/2 place-items-center rounded-r-lg bg-white/90 text-[#2D2525] shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-colors hover:bg-white md:grid"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            aria-label="Next slide"
            onClick={() => go(1)}
            className="absolute right-0 top-1/2 hidden h-16 w-9 -translate-y-1/2 place-items-center rounded-l-lg bg-white/90 text-[#2D2525] shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-colors hover:bg-white md:grid"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5 md:bottom-3">
            {slides.map((s, i) => (
              <button
                key={s.key}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full shadow-[0_0_3px_rgba(0,0,0,0.4)] transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState, type ReactNode, type Ref } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

export const GALLERY_INTERVAL_MS = 4000;

/** Cycles an index through `count` slides every 4s; restarts whenever `index` changes (e.g. manual pick). */
export function useAutoRotate(count: number, paused = false) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % count), GALLERY_INTERVAL_MS);
    return () => clearTimeout(id);
  }, [count, paused, index]);

  return [index, setIndex] as const;
}

export function ImageGallery({
  images,
  alt,
  dim = false,
  imgRef,
  children,
  variant = "default",
}: {
  images: string[];
  alt: string;
  dim?: boolean;
  imgRef?: Ref<HTMLImageElement>;
  children?: ReactNode;
  /** "detail" = product page: left thumbnails, arrows, zoom. Default keeps the card look. */
  variant?: "default" | "detail";
}) {
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useAutoRotate(images.length, paused);
  const safeImages = images.length ? images : [""];
  const [zoom, setZoom] = useState(false);

  if (variant === "detail") {
    const go = (d: number) => setIndex((index + d + safeImages.length) % safeImages.length);
    const multi = safeImages.length > 1;
    return (
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="md:flex md:flex-row-reverse md:gap-4"
      >
        <div className="group relative aspect-square min-w-0 flex-1 overflow-hidden rounded-2xl bg-[#FFF0F0] md:rounded-[20px]">
          {safeImages.map((src, i) => (
            <img
              key={src + i}
              ref={i === index ? imgRef : undefined}
              src={src}
              alt={`${alt} — image ${i + 1} of ${safeImages.length}`}
              width={800}
              height={800}
              aria-hidden={i !== index}
              className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.02] ${
                i === index ? "opacity-100" : "opacity-0"
              } ${dim ? "opacity-60 grayscale" : ""}`}
            />
          ))}
          {children}
          {multi && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() => go(-1)}
                className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#2D2525] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-colors hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() => go(1)}
                className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#2D2525] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-colors hover:bg-white"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <button
            type="button"
            aria-label="Expand image"
            onClick={() => setZoom(true)}
            className="absolute bottom-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-lg bg-white/90 text-[#2D2525] shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:bg-white"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {multi && (
          <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto md:mt-0 md:flex-col md:overflow-visible">
            {safeImages.map((src, i) => (
              <button
                key={src + i}
                type="button"
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border-2 bg-[#FFF0F0] transition-colors ${
                  i === index ? "border-[#8E1828]" : "border-[#E9DADA] opacity-80 hover:opacity-100"
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {zoom && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Product image"
            className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4"
            onClick={() => setZoom(false)}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90"
              onClick={() => setZoom(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={safeImages[index]}
              alt={alt}
              className="max-h-[90vh] max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative aspect-square overflow-hidden md:rounded-2xl">
        {safeImages.map((src, i) => (
          <img
            key={src + i}
            ref={i === index ? imgRef : undefined}
            src={src}
            alt={`${alt} — image ${i + 1} of ${safeImages.length}`}
            width={800}
            height={800}
            aria-hidden={i !== index}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            } ${dim ? "opacity-60 grayscale" : ""}`}
          />
        ))}
        {children}
        {safeImages.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {safeImages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="mt-3 hidden gap-2 md:flex">
          {safeImages.map((src, i) => (
            <button
              key={src + i}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-16 w-16 overflow-hidden rounded-xl border-2 transition-colors ${
                i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

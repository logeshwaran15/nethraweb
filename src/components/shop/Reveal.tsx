import { useEffect, useRef, useState, type ReactNode } from "react";

const STAGGER_MS = 90;
const MAX_STAGGER_STEPS = 12;

/**
 * Fades + slides an element up into place the first time it scrolls into view.
 * `index` staggers a grid of these so items reveal one after another instead
 * of all at once.
 */
export function Reveal({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${visible ? "animate-fade-up" : "opacity-0"} ${className}`}
      style={
        visible
          ? { animationDelay: `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_MS}ms` }
          : undefined
      }
    >
      {children}
    </div>
  );
}

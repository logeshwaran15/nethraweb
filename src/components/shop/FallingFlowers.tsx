import { useMemo } from "react";

const EMOJIS = ["🌸", "🌺", "🌷", "💮", "🏵️"];

export function FallingFlowers({ count = 24 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 14 + Math.random() * 16,
        duration: 2.2 + Math.random() * 1.8,
        delay: Math.random() * 0.6,
        drift: (Math.random() - 0.5) * 120,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[998] overflow-hidden">
      {petals.map((p) => (
        <span
          key={p.id}
          className="animate-petal-fall absolute top-0"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--petal-drift" as string]: `${p.drift}px`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

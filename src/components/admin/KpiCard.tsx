import type { LucideIcon } from "lucide-react";

export const KPI_COLORS = {
  rose: {
    card: "border-primary/30 from-rose-50 to-white",
    bar: "bg-primary",
    text: "text-primary",
    chip: "from-primary to-rose-700 text-white",
    ring: "ring-primary",
  },
  emerald: {
    card: "border-emerald-200 from-emerald-50 to-white",
    bar: "bg-emerald-500",
    text: "text-emerald-700",
    chip: "from-emerald-400 to-emerald-600 text-white",
    ring: "ring-emerald-500",
  },
  sky: {
    card: "border-sky-200 from-sky-50 to-white",
    bar: "bg-sky-500",
    text: "text-sky-700",
    chip: "from-sky-400 to-blue-600 text-white",
    ring: "ring-sky-500",
  },
  violet: {
    card: "border-violet-200 from-violet-50 to-white",
    bar: "bg-violet-500",
    text: "text-violet-700",
    chip: "from-violet-400 to-purple-600 text-white",
    ring: "ring-violet-500",
  },
  amber: {
    card: "border-amber-200 from-amber-50 to-white",
    bar: "bg-amber-500",
    text: "text-amber-700",
    chip: "from-amber-400 to-orange-500 text-white",
    ring: "ring-amber-500",
  },
  red: {
    card: "border-red-200 from-red-50 to-white",
    bar: "bg-red-500",
    text: "text-red-700",
    chip: "from-red-400 to-red-600 text-white",
    ring: "ring-red-500",
  },
};

/** Compact colored KPI card. Pass `onClick` to make it a filter toggle. */
export function KpiCard({
  label,
  value,
  note,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  value: string;
  note?: string;
  icon: LucideIcon;
  color: keyof typeof KPI_COLORS;
  active?: boolean;
  onClick?: () => void;
}) {
  const t = KPI_COLORS[color];
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${t.card} ${
        active ? `ring-2 ring-offset-1 ${t.ring}` : ""
      }`}
    >
      <span
        className={`pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full opacity-20 ${t.bar}`}
      />
      <div className="relative flex items-center gap-2.5">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${t.chip}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className={`truncate text-[11px] font-bold uppercase tracking-wide ${t.text}`}>
            {label}
          </p>
          <p className="truncate font-sans text-3xl font-extrabold leading-tight text-[#2D2525]">
            {value}
          </p>
        </div>
      </div>
      {note && (
        <p className="relative mt-1.5 truncate text-[11px] font-medium text-muted-foreground">
          {note}
        </p>
      )}
    </Tag>
  );
}

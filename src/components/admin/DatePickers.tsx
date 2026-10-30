import { useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ISO = "yyyy-MM-dd";
const toDate = (s: string) => (s ? parseISO(s) : undefined);
const toIso = (d?: Date) => (d ? format(d, ISO) : "");

const triggerCls =
  "flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/40";

const PRESETS: { label: string; range: () => DateRange | undefined }[] = [
  { label: "Today", range: () => ({ from: startOfDay(new Date()), to: startOfDay(new Date()) }) },
  {
    label: "Last 7 days",
    range: () => ({ from: startOfDay(subDays(new Date(), 6)), to: startOfDay(new Date()) }),
  },
  {
    label: "Last 30 days",
    range: () => ({ from: startOfDay(subDays(new Date(), 29)), to: startOfDay(new Date()) }),
  },
  {
    label: "This month",
    range: () => ({ from: startOfMonth(new Date()), to: startOfDay(new Date()) }),
  },
  {
    label: "Last month",
    range: () => {
      const m = subMonths(new Date(), 1);
      return { from: startOfMonth(m), to: endOfMonth(m) };
    },
  },
  { label: "All time", range: () => undefined },
];

/** Range picker. `from` / `to` are yyyy-MM-dd strings ("" when unset). */
export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected: DateRange | undefined = from
    ? { from: toDate(from), to: toDate(to) ?? toDate(from) }
    : undefined;

  const label = from
    ? to && to !== from
      ? `${format(parseISO(from), "dd MMM yyyy")} – ${format(parseISO(to), "dd MMM yyyy")}`
      : format(parseISO(from), "dd MMM yyyy")
    : "Select dates";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerCls} aria-label="Date range">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className={from ? "font-semibold" : "text-muted-foreground"}>{label}</span>
          {from && (
            <span
              role="button"
              aria-label="Clear dates"
              onClick={(e) => {
                e.stopPropagation();
                onChange("", "");
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-sm p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-row flex-wrap gap-1 border-b border-border p-2 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  const r = p.range();
                  onChange(toIso(r?.from), toIso(r?.to));
                  if (!r) setOpen(false);
                }}
                className="rounded-sm px-3 py-1.5 text-left text-xs font-semibold hover:bg-accent"
              >
                {p.label}
              </button>
            ))}
          </div>
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={selected}
            onSelect={(r) => onChange(toIso(r?.from), toIso(r?.to))}
            defaultMonth={selected?.from ?? subMonths(new Date(), 1)}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-sm bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Apply
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Single-date picker. `value` is a yyyy-MM-dd string ("" when unset). */
export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={`${triggerCls} w-full ${className}`}>
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className={selected ? "font-semibold" : "text-muted-foreground"}>
            {selected ? format(selected, "dd MMM yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto rounded-sm p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? new Date()}
          onSelect={(d) => {
            onChange(toIso(d));
            setOpen(false);
          }}
        />
        {value && (
          <div className="border-t border-border px-3 py-2 text-right">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

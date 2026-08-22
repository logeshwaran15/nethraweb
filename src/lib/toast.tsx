import { useEffect, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

export type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

let nextId = 1;
let toasts: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

const emit = () => listeners.forEach((l) => l([...toasts]));

export function showToast(message: string, type: ToastType = "info") {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

const icons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: "border-success/30 bg-success/10 text-success",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-border bg-card text-foreground",
};

export function ToastHost() {
  const [list, setList] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[999] flex flex-col items-center gap-2 px-4">
      {list.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={`animate-in fade-in slide-in-from-top-2 pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-[var(--shadow-soft)] backdrop-blur ${styles[t.type]}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

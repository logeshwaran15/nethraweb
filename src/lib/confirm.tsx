import { useEffect, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** "danger" for deletes (red), "default" for updates. */
  variant?: "danger" | "default";
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let pending: Pending | null = null;
const listeners = new Set<(p: Pending | null) => void>();
const emit = () => listeners.forEach((l) => l(pending));

/** Global confirmation card. Resolves true when confirmed, false when cancelled. */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    // A newer request cancels any card still open.
    pending?.resolve(false);
    pending = { ...options, resolve };
    emit();
  });
}

function settle(ok: boolean) {
  const current = pending;
  pending = null;
  emit();
  current?.resolve(ok);
}

export function ConfirmHost() {
  const [current, setCurrent] = useState<Pending | null>(null);

  useEffect(() => {
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settle(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current]);

  if (!current) return null;

  const danger = current.variant === "danger";
  const Icon = danger ? AlertTriangle : HelpCircle;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4"
      onClick={() => settle(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="animate-in fade-in zoom-in-95 w-full max-w-sm rounded-2xl border border-border bg-white p-5 shadow-[0_12px_40px_rgba(45,37,37,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger ? "bg-[#FEE4E2] text-[#D92D20]" : "bg-accent text-primary"
            }`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#2D2525]">
              {current.title ?? (danger ? "Delete this item?" : "Save changes?")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{current.message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => settle(false)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            {current.cancelText ?? "Cancel"}
          </button>
          <button
            autoFocus
            onClick={() => settle(true)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              danger ? "bg-[#D92D20] hover:bg-[#B42318]" : "bg-primary hover:opacity-90"
            }`}
          >
            {current.confirmText ?? (danger ? "Delete" : "Update")}
          </button>
        </div>
      </div>
    </div>
  );
}

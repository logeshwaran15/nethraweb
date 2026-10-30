import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 300;

/**
 * Debounces a loading flag so skeletons only appear when a fetch genuinely
 * takes a while — a load that resolves in under `delayMs` never shows a
 * skeleton at all, avoiding the "flash of loading state" on fast/cached
 * requests. Flips back to false immediately once loading actually finishes.
 */
export function useDelayedLoading(loading: boolean, delayMs = DEFAULT_DELAY_MS): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShow(false);
      return;
    }
    const timeout = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timeout);
  }, [loading, delayMs]);

  return show;
}

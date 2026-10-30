import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/** Page search box state that also picks up `?q=` from the admin top-bar search. */
export function useSearchQuery() {
  const { search } = useLocation();
  const [query, setQuery] = useState(() => new URLSearchParams(search).get("q") ?? "");

  useEffect(() => {
    const q = new URLSearchParams(search).get("q");
    if (q !== null) setQuery(q);
  }, [search]);

  return [query, setQuery] as const;
}

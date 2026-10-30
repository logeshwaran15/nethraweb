import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchCategories, fetchProducts, type Category, type Product } from "./catalog";
import { useDelayedLoading } from "./use-delayed-loading";

type CatalogState = {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: boolean;
  reload: () => void;
};

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((err) => {
        console.error("Failed to load catalog:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Only surface "loading" to pages once the fetch has genuinely taken a
  // while — fast/cached loads never show a skeleton at all.
  const showLoading = useDelayedLoading(loading);

  return (
    <CatalogContext.Provider
      value={{ products, categories, loading: showLoading, error, reload: load }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
  return ctx;
}

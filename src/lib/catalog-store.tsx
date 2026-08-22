import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchCategories, fetchProducts, type Category, type Product } from "./catalog";

type CatalogState = {
  products: Product[];
  categories: Category[];
  loading: boolean;
};

const CatalogContext = createContext<CatalogState | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((err) => console.error("Failed to load catalog:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CatalogContext.Provider value={{ products, categories, loading }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
  return ctx;
}

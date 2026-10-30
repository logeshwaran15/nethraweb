import { apiGet } from "./api";

export type Variant = {
  label: string;
  price: number;
  mrp: number;
  stock: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  mrp: number;
  image: string;
  images: string[];
  category: string;
  group: "stencils" | "accessories";
  rating: number;
  reviews: number;
  tagline: string;
  bullets: string[];
  stock: number;
  /** Per-option price/stock (e.g. colours 1-11). When present, price/mrp/stock above are the lowest price / total stock. */
  variants: Variant[];
  /** Set only on a cart line: the option the shopper picked. price/mrp/stock then belong to that option. */
  variantLabel?: string;
};

/** Cart-line identity: the same product with different options are different lines. */
export const lineKey = (p: Product) => (p.variantLabel ? `${p.id}::${p.variantLabel}` : p.id);

/** The product as a cart line for one chosen option (name, price, stock become that option's). */
export function withVariant(product: Product, label: string): Product {
  const v = product.variants.find((x) => x.label === label);
  if (!v) return product;
  return {
    ...product,
    // Shown in the cart, WhatsApp order, invoice and admin orders — the number is what the
    // shopper chose (each number is a different colour), so it must be unmistakable.
    name: `${product.name} (No. ${v.label})`,
    price: v.price,
    mrp: v.mrp > 0 ? v.mrp : v.price,
    stock: v.stock,
    variantLabel: v.label,
  };
}

export function parseVariants(raw: string | null): Variant[] {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => v && typeof v.label === "string" && v.label)
      .map((v) => ({
        label: String(v.label),
        price: Number(v.price) || 0,
        mrp: Number(v.mrp) || 0,
        stock: Number(v.stock) || 0,
      }));
  } catch {
    return [];
  }
}

export type Category = {
  slug: string;
  name: string;
  image: string;
  group: "stencils" | "accessories";
  /** 1, 2, 3… = position chosen in admin; 0 = unpositioned (listed after, A-Z). */
  sortOrder: number;
};

/** Positioned categories (1, 2, 3…) first in that order, then the rest A-Z. */
export function compareCategories(
  a: { sortOrder: number; name: string },
  b: { sortOrder: number; name: string },
): number {
  const ao = a.sortOrder > 0 ? a.sortOrder : Number.MAX_SAFE_INTEGER;
  const bo = b.sortOrder > 0 ? b.sortOrder : Number.MAX_SAFE_INTEGER;
  return ao - bo || a.name.localeCompare(b.name);
}

type ProductRow = {
  Productkey: string;
  Name: string;
  Tagline: string | null;
  Description: string | null;
  CategoryKeyRef: string | null;
  ProductGroup: "stencils" | "accessories";
  ImagePath: string | null;
  ImagePaths: string | null;
  Price: string | number;
  Mrp: string | number;
  Rating: string | number;
  ReviewsCount: string | number;
  Stock: string | number;
  Variants?: string | null;
  IsActive: string | number;
};

type CategoryRow = {
  Slug: string;
  Name: string;
  ImagePath: string | null;
  CategoryGroup: "stencils" | "accessories";
  SortOrder?: string | number | null;
  IsActive: string | number;
};

export function parseImages(paths: string | null, primary: string | null): string[] {
  try {
    const parsed = paths ? JSON.parse(paths) : null;
    if (Array.isArray(parsed) && parsed.length)
      return parsed.filter((s): s is string => typeof s === "string" && !!s);
  } catch {
    // fall through to the single primary image
  }
  return primary ? [primary] : [];
}

const productFromRow = (r: ProductRow): Product => {
  const variants = parseVariants(r.Variants ?? null);
  const cheapest = variants.length
    ? variants.reduce((a, b) => (b.price < a.price ? b : a))
    : null;
  return {
    id: r.Productkey,
    name: r.Name,
    price: cheapest ? cheapest.price : Number(r.Price),
    mrp: cheapest ? (cheapest.mrp > 0 ? cheapest.mrp : cheapest.price) : Number(r.Mrp),
    image: r.ImagePath ?? "",
    images: parseImages(r.ImagePaths, r.ImagePath),
    category: r.CategoryKeyRef ?? "",
    group: r.ProductGroup,
    rating: Number(r.Rating),
    reviews: Number(r.ReviewsCount),
    tagline: r.Tagline ?? "",
    bullets: r.Description ? r.Description.split("\n").filter(Boolean) : [],
    stock: variants.length ? variants.reduce((s, v) => s + v.stock, 0) : Number(r.Stock),
    variants,
  };
};

const categoryFromRow = (r: CategoryRow): Category => ({
  slug: r.Slug,
  name: r.Name,
  image: r.ImagePath ?? "",
  group: r.CategoryGroup,
  sortOrder: Number(r.SortOrder) || 0,
});

export async function fetchProducts(): Promise<Product[]> {
  const rows = await apiGet<ProductRow[]>("/api/products.php");
  return rows.filter((r) => Number(r.IsActive) === 1).map(productFromRow);
}

export async function fetchCategories(): Promise<Category[]> {
  const rows = await apiGet<CategoryRow[]>("/api/categories.php");
  return rows
    .filter((r) => Number(r.IsActive) === 1)
    .map(categoryFromRow)
    .sort(compareCategories);
}

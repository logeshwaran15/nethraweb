import { apiGet } from "./api";

export type Product = {
  id: string;
  name: string;
  price: number;
  mrp: number;
  image: string;
  category: string;
  group: "stencils" | "accessories";
  rating: number;
  reviews: number;
  tagline: string;
  bullets: string[];
};

export type Category = {
  slug: string;
  name: string;
  image: string;
  group: "stencils" | "accessories";
};

type ProductRow = {
  Productkey: string;
  Name: string;
  Tagline: string | null;
  Description: string | null;
  CategoryKeyRef: string | null;
  ProductGroup: "stencils" | "accessories";
  ImagePath: string | null;
  Price: string | number;
  Mrp: string | number;
  Rating: string | number;
  ReviewsCount: string | number;
  IsActive: string | number;
};

type CategoryRow = {
  Slug: string;
  Name: string;
  ImagePath: string | null;
  CategoryGroup: "stencils" | "accessories";
  IsActive: string | number;
};

const productFromRow = (r: ProductRow): Product => ({
  id: r.Productkey,
  name: r.Name,
  price: Number(r.Price),
  mrp: Number(r.Mrp),
  image: r.ImagePath ?? "",
  category: r.CategoryKeyRef ?? "",
  group: r.ProductGroup,
  rating: Number(r.Rating),
  reviews: Number(r.ReviewsCount),
  tagline: r.Tagline ?? "",
  bullets: r.Description ? r.Description.split("\n").filter(Boolean) : [],
});

const categoryFromRow = (r: CategoryRow): Category => ({
  slug: r.Slug,
  name: r.Name,
  image: r.ImagePath ?? "",
  group: r.CategoryGroup,
});

export async function fetchProducts(): Promise<Product[]> {
  const rows = await apiGet<ProductRow[]>("/api/products.php");
  return rows.filter((r) => Number(r.IsActive) === 1).map(productFromRow);
}

export async function fetchCategories(): Promise<Category[]> {
  const rows = await apiGet<CategoryRow[]>("/api/categories.php");
  return rows.filter((r) => Number(r.IsActive) === 1).map(categoryFromRow);
}

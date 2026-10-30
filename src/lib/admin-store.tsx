import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiDelete, apiGet, apiPost, apiPut } from "./api";
import { compareCategories, parseImages, parseVariants, type Variant } from "./catalog";
import { confirmAction } from "./confirm";
import { showToast } from "./toast";

export type AdminProduct = {
  id: string; // Products.Productkey
  name: string;
  price: number;
  mrp: number;
  image: string;
  images: string[]; // 1-5 gallery images; image is always images[0]
  category: string; // Categories.Categorykey (slug-like key used across the storefront)
  group: "stencils" | "accessories";
  rating: number;
  reviews: number;
  tagline: string;
  bullets: string[];
  stock: number;
  /** Per-option price/stock; when non-empty, price/mrp/stock above are derived from these. */
  variants: Variant[];
  active: boolean;
};

export type AdminCategory = {
  slug: string;
  name: string;
  image: string;
  group: "stencils" | "accessories";
  /** 1, 2, 3… = position on the storefront; 0 = unpositioned (listed after, A-Z). */
  sortOrder: number;
  active: boolean;
  dbKey: string; // Categories.Categorykey — needed to PUT/DELETE
};

export type SeoSettings = {
  siteTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  canonicalUrl: string;
};

export type PaymentSettings = {
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  codEnabled: boolean;
  whatsappOrderEnabled: boolean;
  upiId: string;
  freeShippingAbove: number;
  flatShippingFee: number;
};

export type AboutSettings = {
  heading: string;
  subheading: string;
  body: string;
  image: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
};

export type ContactSettings = {
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  address: string;
  instagramUrl: string;
  facebookUrl: string;
};

export type Customer = {
  id: string; // Users.Userkey
  name: string;
  email: string;
  phone: string;
  joined: string;
  orders: number;
  totalSpent: number;
  status: "Active" | "Blocked";
};

export type Coupon = {
  code: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  expiry: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
  dbKey: string; // Coupons.Couponkey — needed to PUT/DELETE
};

export type Banner = {
  id: string; // Banners.Bannerkey
  title: string;
  subtitle: string;
  imagePath: string;
  linkUrl: string;
  buttonText: string;
  placement: "home" | "category" | "offer";
  sortOrder: number;
  active: boolean;
};

export type Announcement = {
  id: string; // Announcements.Announcementkey
  message: string;
  linkUrl: string;
  sortOrder: number;
  active: boolean;
};

export type DeliveryZone = {
  id: string; // DeliveryZones.Zonekey
  zoneName: string;
  pincodePrefix: string;
  deliveryFee: number;
  freeShippingAbove: number;
  estimatedDays: string;
  sortOrder: number;
  active: boolean;
};

/** `silent` skips the confirm card and toasts, and rethrows errors (for bulk/inline callers). */
export type GuardOpts = { silent?: boolean };

type AdminState = {
  products: AdminProduct[];
  categories: AdminCategory[];
  saveProduct: (p: AdminProduct, originalId?: string, opts?: GuardOpts) => Promise<boolean | void>;
  deleteProduct: (id: string, opts?: GuardOpts) => Promise<boolean | void>;
  saveCategory: (
    c: AdminCategory,
    originalSlug?: string,
    opts?: GuardOpts,
  ) => Promise<boolean | void>;
  deleteCategory: (slug: string, opts?: GuardOpts) => Promise<boolean | void>;
  about: AboutSettings;
  setAbout: (s: AboutSettings, opts?: GuardOpts) => Promise<boolean | void>;
  seo: SeoSettings;
  setSeo: (s: SeoSettings, opts?: GuardOpts) => Promise<boolean | void>;
  payment: PaymentSettings;
  setPayment: (s: PaymentSettings, opts?: GuardOpts) => Promise<boolean | void>;
  contact: ContactSettings;
  setContact: (s: ContactSettings, opts?: GuardOpts) => Promise<boolean | void>;
  customers: Customer[];
  setCustomerStatus: (
    id: string,
    status: Customer["status"],
    opts?: GuardOpts,
  ) => Promise<boolean | void>;
  coupons: Coupon[];
  saveCoupon: (c: Coupon, originalCode?: string, opts?: GuardOpts) => Promise<boolean | void>;
  deleteCoupon: (code: string, opts?: GuardOpts) => Promise<boolean | void>;
  banners: Banner[];
  saveBanner: (b: Banner, originalId?: string, opts?: GuardOpts) => Promise<boolean | void>;
  deleteBanner: (id: string, opts?: GuardOpts) => Promise<boolean | void>;
  announcements: Announcement[];
  saveAnnouncement: (
    a: Announcement,
    originalId?: string,
    opts?: GuardOpts,
  ) => Promise<boolean | void>;
  deleteAnnouncement: (id: string, opts?: GuardOpts) => Promise<boolean | void>;
  deliveryZones: DeliveryZone[];
  saveDeliveryZone: (
    z: DeliveryZone,
    originalId?: string,
    opts?: GuardOpts,
  ) => Promise<boolean | void>;
  deleteDeliveryZone: (id: string, opts?: GuardOpts) => Promise<boolean | void>;
};

const AdminContext = createContext<AdminState | null>(null);

// ---------- DB row <-> app-shape mappers ----------

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

const productFromRow = (r: ProductRow): AdminProduct => ({
  id: r.Productkey,
  name: r.Name,
  price: Number(r.Price),
  mrp: Number(r.Mrp),
  image: r.ImagePath ?? "",
  images: parseImages(r.ImagePaths, r.ImagePath),
  category: r.CategoryKeyRef ?? "",
  group: r.ProductGroup,
  rating: Number(r.Rating),
  reviews: Number(r.ReviewsCount),
  tagline: r.Tagline ?? "",
  bullets: r.Description ? r.Description.split("\n").filter(Boolean) : [],
  stock: Number(r.Stock),
  variants: parseVariants(r.Variants ?? null),
  active: Number(r.IsActive) === 1,
});

const productToBody = (p: AdminProduct) => ({
  Name: p.name,
  Tagline: p.tagline,
  Description: p.bullets.join("\n"),
  CategoryKeyRef: p.category || null,
  ProductGroup: p.group,
  ImagePath: p.images[0] ?? p.image,
  ImagePaths: JSON.stringify(p.images),
  Price: p.price,
  Mrp: p.mrp,
  Rating: p.rating,
  ReviewsCount: p.reviews,
  Stock: p.stock,
  // "[]" (not null) so removing every option actually clears them — the API keeps old values for null.
  Variants: JSON.stringify(p.variants),
  IsActive: p.active ? 1 : 0,
});

type CategoryRow = {
  Categorykey: string;
  Slug: string;
  Name: string;
  ImagePath: string | null;
  CategoryGroup: "stencils" | "accessories";
  SortOrder?: string | number | null;
  IsActive: string | number;
};

const categoryFromRow = (r: CategoryRow): AdminCategory => ({
  slug: r.Slug,
  name: r.Name,
  image: r.ImagePath ?? "",
  group: r.CategoryGroup,
  sortOrder: Number(r.SortOrder) || 0,
  active: Number(r.IsActive) === 1,
  dbKey: r.Categorykey,
});

const categoryToBody = (c: AdminCategory) => ({
  Slug: c.slug,
  Name: c.name,
  ImagePath: c.image,
  CategoryGroup: c.group,
  SortOrder: c.sortOrder || 0,
  IsActive: c.active ? 1 : 0,
});

type CouponRow = {
  Couponkey: string;
  Code: string;
  DiscountType: "percent" | "flat";
  Value: string | number;
  MinOrderAmount: string | number;
  UsageLimit: string | number;
  UsageCount: string | number;
  ExpiryOn: string | null;
  IsActive: string | number;
};

const couponFromRow = (r: CouponRow): Coupon => ({
  code: r.Code,
  type: r.DiscountType,
  value: Number(r.Value),
  minOrder: Number(r.MinOrderAmount),
  expiry: r.ExpiryOn ? r.ExpiryOn.slice(0, 10) : "",
  usageLimit: Number(r.UsageLimit),
  usageCount: Number(r.UsageCount),
  active: Number(r.IsActive) === 1,
  dbKey: r.Couponkey,
});

const couponToBody = (c: Coupon) => ({
  Code: c.code,
  DiscountType: c.type,
  Value: c.value,
  MinOrderAmount: c.minOrder,
  UsageLimit: c.usageLimit,
  UsageCount: c.usageCount,
  ExpiryOn: c.expiry || null,
  IsActive: c.active ? 1 : 0,
});

type BannerRow = {
  Bannerkey: string;
  Title: string | null;
  Subtitle: string | null;
  ImagePath: string;
  LinkUrl: string | null;
  ButtonText: string | null;
  Placement: "home" | "category" | "offer";
  SortOrder: string | number;
  IsActive: string | number;
};

const bannerFromRow = (r: BannerRow): Banner => ({
  id: r.Bannerkey,
  title: r.Title ?? "",
  subtitle: r.Subtitle ?? "",
  imagePath: r.ImagePath ?? "",
  linkUrl: r.LinkUrl ?? "",
  buttonText: r.ButtonText ?? "",
  placement: r.Placement,
  sortOrder: Number(r.SortOrder),
  active: Number(r.IsActive) === 1,
});

const bannerToBody = (b: Banner) => ({
  Title: b.title,
  Subtitle: b.subtitle,
  ImagePath: b.imagePath || "pending-upload",
  LinkUrl: b.linkUrl,
  ButtonText: b.buttonText,
  Placement: b.placement,
  SortOrder: b.sortOrder,
  IsActive: b.active ? 1 : 0,
});

type AnnouncementRow = {
  Announcementkey: string;
  Message: string;
  LinkUrl: string | null;
  SortOrder: string | number;
  IsActive: string | number;
};

const announcementFromRow = (r: AnnouncementRow): Announcement => ({
  id: r.Announcementkey,
  message: r.Message,
  linkUrl: r.LinkUrl ?? "",
  sortOrder: Number(r.SortOrder),
  active: Number(r.IsActive) === 1,
});

const announcementToBody = (a: Announcement) => ({
  Message: a.message,
  LinkUrl: a.linkUrl,
  SortOrder: a.sortOrder,
  IsActive: a.active ? 1 : 0,
});

type DeliveryZoneRow = {
  Zonekey: string;
  ZoneName: string;
  PincodePrefix: string;
  DeliveryFee: string | number;
  FreeShippingAbove: string | number;
  EstimatedDays: string;
  SortOrder: string | number;
  IsActive: string | number;
};

const deliveryZoneFromRow = (r: DeliveryZoneRow): DeliveryZone => ({
  id: r.Zonekey,
  zoneName: r.ZoneName,
  pincodePrefix: r.PincodePrefix,
  deliveryFee: Number(r.DeliveryFee),
  freeShippingAbove: Number(r.FreeShippingAbove),
  estimatedDays: r.EstimatedDays,
  sortOrder: Number(r.SortOrder),
  active: Number(r.IsActive) === 1,
});

const deliveryZoneToBody = (z: DeliveryZone) => ({
  ZoneName: z.zoneName,
  PincodePrefix: z.pincodePrefix,
  DeliveryFee: z.deliveryFee,
  FreeShippingAbove: z.freeShippingAbove,
  EstimatedDays: z.estimatedDays,
  SortOrder: z.sortOrder,
  IsActive: z.active ? 1 : 0,
});

type UserRow = {
  Userkey: string;
  FullName: string;
  Email: string;
  PhoneNumber: string | null;
  IsActive: string | number;
  CreatedOn: string;
};

const customerFromRow = (r: UserRow): Customer => ({
  id: r.Userkey,
  name: r.FullName,
  email: r.Email,
  phone: r.PhoneNumber ?? "",
  joined: new Date(r.CreatedOn).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }),
  orders: 0,
  totalSpent: 0,
  status: Number(r.IsActive) === 1 ? "Active" : "Blocked",
});

type SeoRow = {
  SiteTitle: string | null;
  MetaDescription: string | null;
  MetaKeywords: string | null;
  OgImagePath: string | null;
  CanonicalUrl: string | null;
};

const seoFromRow = (r: SeoRow): SeoSettings => ({
  siteTitle: r.SiteTitle ?? "",
  metaDescription: r.MetaDescription ?? "",
  metaKeywords: r.MetaKeywords ?? "",
  ogImage: r.OgImagePath ?? "",
  canonicalUrl: r.CanonicalUrl ?? "",
});

const seoToBody = (s: SeoSettings) => ({
  SiteTitle: s.siteTitle,
  MetaDescription: s.metaDescription,
  MetaKeywords: s.metaKeywords,
  OgImagePath: s.ogImage,
  CanonicalUrl: s.canonicalUrl,
});

type PaymentRow = {
  RazorpayEnabled: string | number;
  RazorpayKeyId: string | null;
  CodEnabled: string | number;
  WhatsappOrderEnabled: string | number;
  UpiId: string | null;
  FreeShippingAbove: string | number;
  FlatShippingFee: string | number;
};

const paymentFromRow = (r: PaymentRow): PaymentSettings => ({
  razorpayEnabled: Number(r.RazorpayEnabled) === 1,
  razorpayKeyId: r.RazorpayKeyId ?? "",
  codEnabled: Number(r.CodEnabled) === 1,
  whatsappOrderEnabled: Number(r.WhatsappOrderEnabled) === 1,
  upiId: r.UpiId ?? "",
  freeShippingAbove: Number(r.FreeShippingAbove),
  flatShippingFee: Number(r.FlatShippingFee),
});

const paymentToBody = (p: PaymentSettings) => ({
  RazorpayEnabled: p.razorpayEnabled ? 1 : 0,
  RazorpayKeyId: p.razorpayKeyId,
  CodEnabled: p.codEnabled ? 1 : 0,
  WhatsappOrderEnabled: p.whatsappOrderEnabled ? 1 : 0,
  UpiId: p.upiId,
  FreeShippingAbove: p.freeShippingAbove,
  FlatShippingFee: p.flatShippingFee,
});

type AboutRow = {
  Heading: string | null;
  Subheading: string | null;
  Body: string | null;
  ImagePath: string | null;
  Stat1Label: string | null;
  Stat1Value: string | null;
  Stat2Label: string | null;
  Stat2Value: string | null;
  Stat3Label: string | null;
  Stat3Value: string | null;
};

const aboutFromRow = (r: AboutRow): AboutSettings => ({
  heading: r.Heading ?? "",
  subheading: r.Subheading ?? "",
  body: r.Body ?? "",
  image: r.ImagePath ?? "",
  stat1Label: r.Stat1Label ?? "",
  stat1Value: r.Stat1Value ?? "",
  stat2Label: r.Stat2Label ?? "",
  stat2Value: r.Stat2Value ?? "",
  stat3Label: r.Stat3Label ?? "",
  stat3Value: r.Stat3Value ?? "",
});

const aboutToBody = (a: AboutSettings) => ({
  Heading: a.heading,
  Subheading: a.subheading,
  Body: a.body,
  ImagePath: a.image,
  Stat1Label: a.stat1Label,
  Stat1Value: a.stat1Value,
  Stat2Label: a.stat2Label,
  Stat2Value: a.stat2Value,
  Stat3Label: a.stat3Label,
  Stat3Value: a.stat3Value,
});

type ContactRow = {
  SupportEmail: string | null;
  SupportPhone: string | null;
  WhatsappNumber: string | null;
  Address: string | null;
  InstagramUrl: string | null;
  FacebookUrl: string | null;
};

const contactFromRow = (r: ContactRow): ContactSettings => ({
  supportEmail: r.SupportEmail ?? "",
  supportPhone: r.SupportPhone ?? "",
  whatsappNumber: r.WhatsappNumber ?? "",
  address: r.Address ?? "",
  instagramUrl: r.InstagramUrl ?? "",
  facebookUrl: r.FacebookUrl ?? "",
});

const contactToBody = (c: ContactSettings) => ({
  SupportEmail: c.supportEmail,
  SupportPhone: c.supportPhone,
  WhatsappNumber: c.whatsappNumber,
  Address: c.address,
  InstagramUrl: c.instagramUrl,
  FacebookUrl: c.facebookUrl,
});

const emptyAbout: AboutSettings = {
  heading: "",
  subheading: "",
  body: "",
  image: "",
  stat1Label: "",
  stat1Value: "",
  stat2Label: "",
  stat2Value: "",
  stat3Label: "",
  stat3Value: "",
};
const emptySeo: SeoSettings = {
  siteTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogImage: "",
  canonicalUrl: "",
};
const emptyPayment: PaymentSettings = {
  razorpayEnabled: false,
  razorpayKeyId: "",
  codEnabled: false,
  whatsappOrderEnabled: false,
  upiId: "",
  freeShippingAbove: 0,
  flatShippingFee: 0,
};
const emptyContact: ContactSettings = {
  supportEmail: "",
  supportPhone: "",
  whatsappNumber: "",
  address: "",
  instagramUrl: "",
  facebookUrl: "",
};

// ---------- global confirm + success/error alerts for every admin write ----------

type Plan = {
  /** Present when the action needs a confirmation card first. */
  confirm?: { title: string; message: string; confirmText: string; danger?: boolean } | undefined;
  success: string;
  failure: string;
};

/**
 * Wraps one store action: confirm (if the plan asks for it) → run → success toast.
 * Errors are toasted and swallowed. Pass `{ silent: true }` as the action's last
 * argument to skip all UI and get raw behaviour (errors rethrown).
 */
function guard<A extends unknown[]>(
  fn: (...args: A) => Promise<unknown>,
  optsIndex: number,
  plan: (...args: A) => Plan,
) {
  return async (...typed: A): Promise<boolean | void> => {
    const opts = typed[optsIndex] as GuardOpts | undefined;
    if (opts?.silent) {
      await fn(...typed);
      return;
    }
    const p = plan(...typed);
    if (p.confirm) {
      const ok = await confirmAction({
        title: p.confirm.title,
        message: p.confirm.message,
        confirmText: p.confirm.confirmText,
        variant: p.confirm.danger ? "danger" : "default",
      });
      if (!ok) return false;
    }
    try {
      await fn(...typed);
      showToast(p.success, "success");
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : p.failure, "error");
      return false;
    }
  };
}

const saved = (noun: string, name: string, isUpdate: boolean) => ({
  confirm: isUpdate
    ? {
        title: `Update ${noun}?`,
        message: `Are you sure you want to save changes to ${name ? `"${name}"` : `this ${noun}`}?`,
        confirmText: "Update",
      }
    : undefined,
  success: `${noun.charAt(0).toUpperCase()}${noun.slice(1)}${name ? ` "${name}"` : ""} ${isUpdate ? "updated" : "created"} successfully`,
  failure: `Failed to save ${noun}`,
});

const removed = (noun: string, name: string): Plan => ({
  confirm: {
    title: `Delete ${noun}?`,
    message: `${name ? `"${name}"` : `This ${noun}`} will be permanently deleted. This cannot be undone.`,
    confirmText: "Delete",
    danger: true,
  },
  success: `${noun.charAt(0).toUpperCase()}${noun.slice(1)}${name ? ` "${name}"` : ""} deleted successfully`,
  failure: `Failed to delete ${noun}`,
});

const settings = (noun: string): Plan => ({
  confirm: {
    title: `Update ${noun}?`,
    message: `Are you sure you want to save your ${noun} changes?`,
    confirmText: "Update",
  },
  success: `${noun.charAt(0).toUpperCase()}${noun.slice(1)} updated successfully`,
  failure: `Failed to update ${noun}`,
});

function withGuards(raw: AdminState): AdminState {
  return {
    ...raw,
    saveProduct: guard(raw.saveProduct, 2, (p, orig) => saved("product", p.name, !!orig)),
    deleteProduct: guard(raw.deleteProduct, 1, (id) =>
      removed("product", raw.products.find((x) => x.id === id)?.name ?? ""),
    ),
    saveCategory: guard(raw.saveCategory, 2, (c, orig) => saved("category", c.name, !!orig)),
    deleteCategory: guard(raw.deleteCategory, 1, (slug) =>
      removed("category", raw.categories.find((x) => x.slug === slug)?.name ?? ""),
    ),
    setAbout: guard(raw.setAbout, 1, () => settings("About page settings")),
    setSeo: guard(raw.setSeo, 1, () => settings("SEO settings")),
    setPayment: guard(raw.setPayment, 1, () => settings("payment settings")),
    setContact: guard(raw.setContact, 1, () => settings("contact settings")),
    setCustomerStatus: guard(raw.setCustomerStatus, 2, (id, status) => {
      const name = raw.customers.find((x) => x.id === id)?.name ?? "";
      const block = status === "Blocked";
      return {
        confirm: {
          title: `${block ? "Block" : "Unblock"} customer?`,
          message: `Are you sure you want to ${block ? "block" : "unblock"} ${name ? `"${name}"` : "this customer"}?`,
          confirmText: block ? "Block" : "Unblock",
          danger: block,
        },
        success: `Customer ${name ? `"${name}" ` : ""}${block ? "blocked" : "unblocked"} successfully`,
        failure: "Failed to update customer",
      };
    }),
    saveCoupon: guard(raw.saveCoupon, 2, (c, orig) => saved("coupon", c.code, !!orig)),
    deleteCoupon: guard(raw.deleteCoupon, 1, (code) => removed("coupon", code)),
    saveBanner: guard(raw.saveBanner, 2, (b, orig) => saved("banner", b.title, !!orig)),
    deleteBanner: guard(raw.deleteBanner, 1, (id) =>
      removed("banner", raw.banners.find((x) => x.id === id)?.title ?? ""),
    ),
    saveAnnouncement: guard(raw.saveAnnouncement, 2, (_a, orig) =>
      saved("announcement", "", !!orig),
    ),
    deleteAnnouncement: guard(raw.deleteAnnouncement, 1, () => removed("announcement", "")),
    saveDeliveryZone: guard(raw.saveDeliveryZone, 2, (z, orig) =>
      saved("delivery zone", z.zoneName, !!orig),
    ),
    deleteDeliveryZone: guard(raw.deleteDeliveryZone, 1, (id) =>
      removed("delivery zone", raw.deliveryZones.find((x) => x.id === id)?.zoneName ?? ""),
    ),
  };
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [about, setAboutState] = useState<AboutSettings>(emptyAbout);
  const [seo, setSeoState] = useState<SeoSettings>(emptySeo);
  const [payment, setPaymentState] = useState<PaymentSettings>(emptyPayment);
  const [contact, setContactState] = useState<ContactSettings>(emptyContact);

  useEffect(() => {
    const onFail = (label: string) => (err: unknown) =>
      console.error(`Failed to load ${label}:`, err);

    apiGet<ProductRow[]>("/api/products.php")
      .then((rows) => setProducts(rows.map(productFromRow)))
      .catch(onFail("products"));
    apiGet<CategoryRow[]>("/api/categories.php")
      .then((rows) => setCategories(rows.map(categoryFromRow).sort(compareCategories)))
      .catch(onFail("categories"));
    apiGet<CouponRow[]>("/api/coupons.php")
      .then((rows) => setCoupons(rows.map(couponFromRow)))
      .catch(onFail("coupons"));
    apiGet<UserRow[]>("/api/users.php?role=Customer")
      .then((rows) => setCustomers(rows.map(customerFromRow)))
      .catch(onFail("customers"));
    apiGet<BannerRow[]>("/api/banners.php")
      .then((rows) => setBanners(rows.map(bannerFromRow)))
      .catch(onFail("banners"));
    apiGet<AnnouncementRow[]>("/api/announcements.php")
      .then((rows) => setAnnouncements(rows.map(announcementFromRow)))
      .catch(onFail("announcements"));
    apiGet<DeliveryZoneRow[]>("/api/delivery_zones.php")
      .then((rows) => setDeliveryZones(rows.map(deliveryZoneFromRow)))
      .catch(onFail("delivery zones"));
    apiGet<AboutRow>("/api/about_settings.php")
      .then((row) => setAboutState(aboutFromRow(row)))
      .catch(onFail("about settings"));
    apiGet<SeoRow>("/api/seo_settings.php")
      .then((row) => setSeoState(seoFromRow(row)))
      .catch(onFail("SEO settings"));
    apiGet<PaymentRow>("/api/payment_settings.php")
      .then((row) => setPaymentState(paymentFromRow(row)))
      .catch(onFail("payment settings"));
    apiGet<ContactRow>("/api/contact_settings.php")
      .then((row) => setContactState(contactFromRow(row)))
      .catch(onFail("contact settings"));
  }, []);

  const value = useMemo<AdminState>(
    () =>
      withGuards({
        products,
        categories,
        saveProduct: async (p, originalId) => {
          const row = originalId
            ? await apiPut<ProductRow>(`/api/products.php?key=${originalId}`, productToBody(p))
            : await apiPost<ProductRow>("/api/products.php", productToBody(p));
          const mapped = productFromRow(row);
          setProducts((list) =>
            list.some((x) => x.id === mapped.id)
              ? list.map((x) => (x.id === mapped.id ? mapped : x))
              : [mapped, ...list],
          );
        },
        deleteProduct: async (id) => {
          await apiDelete(`/api/products.php?key=${id}`);
          setProducts((list) => list.filter((x) => x.id !== id));
        },
        saveCategory: async (c, originalSlug) => {
          const existing = originalSlug
            ? categories.find((x) => x.slug === originalSlug)
            : undefined;
          const row = existing
            ? await apiPut<CategoryRow>(
                `/api/categories.php?key=${existing.dbKey}`,
                categoryToBody(c),
              )
            : await apiPost<CategoryRow>("/api/categories.php", categoryToBody(c));
          const mapped = categoryFromRow(row);
          setCategories((list) =>
            list.some((x) => x.dbKey === mapped.dbKey)
              ? list.map((x) => (x.dbKey === mapped.dbKey ? mapped : x))
              : [mapped, ...list],
          );
        },
        deleteCategory: async (slug) => {
          const existing = categories.find((x) => x.slug === slug);
          if (!existing) return;
          await apiDelete(`/api/categories.php?key=${existing.dbKey}`);
          setCategories((list) => list.filter((x) => x.dbKey !== existing.dbKey));
        },
        about,
        setAbout: async (a) => {
          const row = await apiPut<AboutRow>("/api/about_settings.php", aboutToBody(a));
          setAboutState(aboutFromRow(row));
        },
        seo,
        setSeo: async (s) => {
          const row = await apiPut<SeoRow>("/api/seo_settings.php", seoToBody(s));
          setSeoState(seoFromRow(row));
        },
        payment,
        setPayment: async (p) => {
          const row = await apiPut<PaymentRow>("/api/payment_settings.php", paymentToBody(p));
          setPaymentState(paymentFromRow(row));
        },
        contact,
        setContact: async (c) => {
          const row = await apiPut<ContactRow>("/api/contact_settings.php", contactToBody(c));
          setContactState(contactFromRow(row));
        },
        customers,
        setCustomerStatus: async (id, status) => {
          const row = await apiPut<UserRow>(`/api/users.php?key=${id}`, {
            IsActive: status === "Active" ? 1 : 0,
          });
          const mapped = customerFromRow(row);
          setCustomers((list) =>
            list.map((x) =>
              x.id === id ? { ...mapped, orders: x.orders, totalSpent: x.totalSpent } : x,
            ),
          );
        },
        coupons,
        saveCoupon: async (c, originalCode) => {
          const existing = originalCode ? coupons.find((x) => x.code === originalCode) : undefined;
          const row = existing
            ? await apiPut<CouponRow>(`/api/coupons.php?key=${existing.dbKey}`, couponToBody(c))
            : await apiPost<CouponRow>("/api/coupons.php", couponToBody(c));
          const mapped = couponFromRow(row);
          setCoupons((list) =>
            list.some((x) => x.dbKey === mapped.dbKey)
              ? list.map((x) => (x.dbKey === mapped.dbKey ? mapped : x))
              : [mapped, ...list],
          );
        },
        deleteCoupon: async (code) => {
          const existing = coupons.find((x) => x.code === code);
          if (!existing) return;
          await apiDelete(`/api/coupons.php?key=${existing.dbKey}`);
          setCoupons((list) => list.filter((x) => x.dbKey !== existing.dbKey));
        },
        banners,
        saveBanner: async (b, originalId) => {
          const row = originalId
            ? await apiPut<BannerRow>(`/api/banners.php?key=${originalId}`, bannerToBody(b))
            : await apiPost<BannerRow>("/api/banners.php", bannerToBody(b));
          const mapped = bannerFromRow(row);
          setBanners((list) =>
            list.some((x) => x.id === mapped.id)
              ? list.map((x) => (x.id === mapped.id ? mapped : x))
              : [mapped, ...list],
          );
        },
        deleteBanner: async (id) => {
          await apiDelete(`/api/banners.php?key=${id}`);
          setBanners((list) => list.filter((x) => x.id !== id));
        },
        announcements,
        saveAnnouncement: async (a, originalId) => {
          const row = originalId
            ? await apiPut<AnnouncementRow>(
                `/api/announcements.php?key=${originalId}`,
                announcementToBody(a),
              )
            : await apiPost<AnnouncementRow>("/api/announcements.php", announcementToBody(a));
          const mapped = announcementFromRow(row);
          setAnnouncements((list) =>
            list.some((x) => x.id === mapped.id)
              ? list.map((x) => (x.id === mapped.id ? mapped : x))
              : [mapped, ...list],
          );
        },
        deleteAnnouncement: async (id) => {
          await apiDelete(`/api/announcements.php?key=${id}`);
          setAnnouncements((list) => list.filter((x) => x.id !== id));
        },
        deliveryZones,
        saveDeliveryZone: async (z, originalId) => {
          const row = originalId
            ? await apiPut<DeliveryZoneRow>(
                `/api/delivery_zones.php?key=${originalId}`,
                deliveryZoneToBody(z),
              )
            : await apiPost<DeliveryZoneRow>("/api/delivery_zones.php", deliveryZoneToBody(z));
          const mapped = deliveryZoneFromRow(row);
          setDeliveryZones((list) =>
            list.some((x) => x.id === mapped.id)
              ? list.map((x) => (x.id === mapped.id ? mapped : x))
              : [mapped, ...list],
          );
        },
        deleteDeliveryZone: async (id) => {
          await apiDelete(`/api/delivery_zones.php?key=${id}`);
          setDeliveryZones((list) => list.filter((x) => x.id !== id));
        },
      }),
    [
      products,
      categories,
      coupons,
      customers,
      banners,
      announcements,
      deliveryZones,
      about,
      seo,
      payment,
      contact,
    ],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { lineKey, withVariant, type Product } from "./catalog";
import { apiGet, apiPost, apiPut } from "./api";
import { useAuth } from "./auth-store";
import { useCatalog } from "./catalog-store";

const CART_STORAGE_KEY = "nethras_cart";
const WISHLIST_STORAGE_KEY = "nethras_wishlist";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — cart just won't survive a refresh
  }
}

type CouponRow = {
  Code: string;
  DiscountType: "percent" | "flat";
  Value: string | number;
  MinOrderAmount: string | number;
  UsageLimit: number;
  UsageCount: number;
  ExpiryOn: string | null;
  IsActive: string | number;
};

type CartLine = { product: Product; qty: number };

export type ShippingInfo = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
};

export type PlacedOrder = {
  orderKey: string;
  orderNumber: string;
  total: number;
  items: { name: string; image: string; qty: number; price: number }[];
};

const emptyShipping: ShippingInfo = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
};

type ShopState = {
  cart: CartLine[];
  wishlist: string[];
  addToCart: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  subtotal: number;
  discount: number;
  couponCode: string | null;
  couponDiscount: number;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  shipping: number;
  total: number;
  count: number;
  shippingInfo: ShippingInfo;
  setShippingInfo: (s: ShippingInfo) => void;
  shippingFee: number;
  setShippingFee: (n: number) => void;
  placeOrder: (
    paymentMethod: string,
    payment?: { razorpayOrderId?: string; razorpayPaymentId?: string },
  ) => Promise<PlacedOrder>;
  lastOrder: PlacedOrder | null;
};

const ShopContext = createContext<ShopState | null>(null);

type OrderRow = { Orderkey: string; OrderNumber: string };

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { products } = useCatalog();
  const [cart, setCart] = useState<CartLine[]>(() => loadFromStorage(CART_STORAGE_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() =>
    loadFromStorage(WISHLIST_STORAGE_KEY, []),
  );
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(emptyShipping);
  const [shippingFee, setShippingFee] = useState(0);
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const syncedUserRef = useRef<string | null>(null);

  // Cart/wishlist always survive a refresh via localStorage, guest or logged in.
  useEffect(() => saveToStorage(CART_STORAGE_KEY, cart), [cart]);
  useEffect(() => saveToStorage(WISHLIST_STORAGE_KEY, wishlist), [wishlist]);

  // The very first time this browser sees this account, merge whatever guest cart/wishlist
  // was here into the account's saved ones (added quantities together, once). Every later
  // page load for the same account just loads the server's copy as-is — it must NOT be
  // added again, or a plain refresh would double the quantities every time.
  useEffect(() => {
    if (!user || products.length === 0) return;
    if (syncedUserRef.current === user.Userkey) return;
    syncedUserRef.current = user.Userkey;

    const mergedFlagKey = `nethras_cart_merged_${user.Userkey}`;
    const alreadyMerged = (() => {
      try {
        return localStorage.getItem(mergedFlagKey) === "1";
      } catch {
        return false;
      }
    })();

    (async () => {
      try {
        const [serverCart, serverWishlist] = await Promise.all([
          apiGet<{ ProductKeyRef: string; VariantLabel?: string | null; Qty: number | string }[]>(
            `/api/cart_items.php?userKey=${user.Userkey}`,
          ),
          apiGet<{ ProductKeyRef: string }[]>(`/api/wishlist.php?userKey=${user.Userkey}`),
        ]);

        if (alreadyMerged) {
          // Server is the source of truth from here on — replace, don't add.
          const serverLines: CartLine[] = [];
          for (const row of serverCart) {
            const base = products.find((p) => p.id === row.ProductKeyRef);
            if (!base) continue;
            const product = row.VariantLabel ? withVariant(base, row.VariantLabel) : base;
            serverLines.push({ product, qty: Number(row.Qty) });
          }
          setCart(serverLines);
          setWishlist(serverWishlist.map((w) => w.ProductKeyRef));
          return;
        }

        setCart((prev) => {
          const merged = new Map(prev.map((l) => [lineKey(l.product), l] as const));
          for (const row of serverCart) {
            const base = products.find((p) => p.id === row.ProductKeyRef);
            if (!base) continue;
            const product = row.VariantLabel ? withVariant(base, row.VariantLabel) : base;
            const key = lineKey(product);
            const existing = merged.get(key);
            merged.set(key, { product, qty: (existing?.qty ?? 0) + Number(row.Qty) });
          }
          return Array.from(merged.values());
        });

        setWishlist((prev) =>
          Array.from(new Set([...prev, ...serverWishlist.map((w) => w.ProductKeyRef)])),
        );

        try {
          localStorage.setItem(mergedFlagKey, "1");
        } catch {
          // best-effort — worst case this merge runs again next login on this device
        }
      } catch {
        // backend unreachable — local (guest) cart/wishlist just stays as-is
      }
    })();
  }, [user, products]);

  // Keep the DB in sync while logged in, so cart/wishlist follow the user across devices.
  useEffect(() => {
    if (!user) return;
    apiPut(
      `/api/cart_items.php?userKey=${user.Userkey}`,
      cart.map((l) => ({
        ProductKeyRef: l.product.id,
        VariantLabel: l.product.variantLabel ?? null,
        Qty: l.qty,
      })),
    ).catch(() => {});
  }, [cart, user]);

  useEffect(() => {
    if (!user) return;
    apiPut(`/api/wishlist.php?userKey=${user.Userkey}`, wishlist).catch(() => {});
  }, [wishlist, user]);

  const value = useMemo<ShopState>(() => {
    const subtotal = cart.reduce((s, l) => s + l.product.price * l.qty, 0);
    const mrpTotal = cart.reduce((s, l) => s + l.product.mrp * l.qty, 0);
    const discount = mrpTotal - subtotal;
    const shipping = shippingFee;
    const total = Math.max(0, subtotal - couponDiscount + shipping);

    return {
      cart,
      wishlist,
      subtotal,
      discount,
      couponCode,
      couponDiscount,
      shipping,
      total,
      count: cart.reduce((s, l) => s + l.qty, 0),
      shippingInfo,
      setShippingInfo,
      shippingFee,
      setShippingFee,
      lastOrder,
      addToCart: (product, qty = 1) =>
        setCart((prev) => {
          const key = lineKey(product);
          const found = prev.find((l) => lineKey(l.product) === key);
          if (found)
            return prev.map((l) =>
              lineKey(l.product) === key ? { ...l, qty: Math.min(product.stock || Infinity, l.qty + qty) } : l,
            );
          return [...prev, { product, qty }];
        }),
      setQty: (id, qty) =>
        setCart((prev) =>
          qty <= 0
            ? prev.filter((l) => lineKey(l.product) !== id)
            : prev.map((l) => (lineKey(l.product) === id ? { ...l, qty } : l)),
        ),
      removeFromCart: (id) => setCart((prev) => prev.filter((l) => lineKey(l.product) !== id)),
      clearCart: () => setCart([]),
      applyCoupon: async (code) => {
        const trimmed = code.trim().toUpperCase();
        const coupons = await apiGet<CouponRow[]>("/api/coupons.php");
        const match = coupons.find((c) => c.Code.toUpperCase() === trimmed);

        if (!match || Number(match.IsActive) !== 1) {
          throw new Error("Invalid coupon code");
        }
        if (match.ExpiryOn && new Date(match.ExpiryOn) < new Date()) {
          throw new Error("This coupon has expired");
        }
        if (match.UsageLimit > 0 && match.UsageCount >= match.UsageLimit) {
          throw new Error("This coupon has reached its usage limit");
        }
        if (subtotal < Number(match.MinOrderAmount)) {
          throw new Error(`Minimum order of ₹${match.MinOrderAmount} required for this coupon`);
        }

        const amount =
          match.DiscountType === "percent"
            ? (subtotal * Number(match.Value)) / 100
            : Number(match.Value);

        setCouponCode(match.Code);
        setCouponDiscount(Math.min(amount, subtotal));
      },
      removeCoupon: () => {
        setCouponCode(null);
        setCouponDiscount(0);
      },
      toggleWishlist: (id) =>
        setWishlist((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id])),
      placeOrder: async (paymentMethod, payment) => {
        const orderNumber = `NS${Date.now()}`;
        const order = await apiPost<OrderRow>("/api/orders.php", {
          OrderNumber: orderNumber,
          UserKeyRef: user?.Userkey ?? null,
          Subtotal: subtotal,
          Discount: discount + couponDiscount,
          CouponCode: couponCode,
          ShippingFee: shipping,
          Total: total,
          Status: "Processing",
          PaymentMethod: paymentMethod,
          RazorpayOrderId: payment?.razorpayOrderId ?? null,
          RazorpayPaymentId: payment?.razorpayPaymentId ?? null,
          PaymentStatus: payment?.razorpayPaymentId ? "Paid" : "Pending",
          ShippingName: shippingInfo.fullName,
          ShippingPhone: shippingInfo.phone,
          ShippingAddress: `${shippingInfo.address}${shippingInfo.landmark ? ", " + shippingInfo.landmark : ""}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pincode}`,
        });

        await Promise.all(
          cart.map((line) =>
            apiPost("/api/order_items.php", {
              OrderKeyRef: order.Orderkey,
              ProductKeyRef: line.product.id,
              ProductName: line.product.name,
              ProductImagePath: line.product.image,
              Qty: line.qty,
              Price: line.product.price,
            }),
          ),
        );

        const placed: PlacedOrder = {
          orderKey: order.Orderkey,
          orderNumber: order.OrderNumber,
          total,
          items: cart.map((l) => ({
            name: l.product.name,
            image: l.product.image,
            qty: l.qty,
            price: l.product.price,
          })),
        };
        setLastOrder(placed);
        setCart([]);
        setCouponCode(null);
        setCouponDiscount(0);
        return placed;
      },
    };
  }, [cart, wishlist, shippingInfo, shippingFee, lastOrder, couponCode, couponDiscount]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product } from "./catalog";
import { apiPost } from "./api";

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
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>(emptyShipping);
  const [shippingFee, setShippingFee] = useState(0);
  const [lastOrder, setLastOrder] = useState<PlacedOrder | null>(null);

  const value = useMemo<ShopState>(() => {
    const subtotal = cart.reduce((s, l) => s + l.product.price * l.qty, 0);
    const mrpTotal = cart.reduce((s, l) => s + l.product.mrp * l.qty, 0);
    const discount = mrpTotal - subtotal;
    const shipping = shippingFee;
    const total = subtotal + shipping;

    return {
      cart,
      wishlist,
      subtotal,
      discount,
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
          const found = prev.find((l) => l.product.id === product.id);
          if (found)
            return prev.map((l) =>
              l.product.id === product.id ? { ...l, qty: l.qty + qty } : l,
            );
          return [...prev, { product, qty }];
        }),
      setQty: (id, qty) =>
        setCart((prev) =>
          qty <= 0
            ? prev.filter((l) => l.product.id !== id)
            : prev.map((l) => (l.product.id === id ? { ...l, qty } : l)),
        ),
      removeFromCart: (id) => setCart((prev) => prev.filter((l) => l.product.id !== id)),
      clearCart: () => setCart([]),
      toggleWishlist: (id) =>
        setWishlist((prev) =>
          prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id],
        ),
      placeOrder: async (paymentMethod, payment) => {
        const orderNumber = `NS${Date.now()}`;
        const order = await apiPost<OrderRow>("/api/orders.php", {
          OrderNumber: orderNumber,
          Subtotal: subtotal,
          Discount: discount,
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
        return placed;
      },
    };
  }, [cart, wishlist, shippingInfo, shippingFee, lastOrder]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}

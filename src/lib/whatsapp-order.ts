import { inr } from "./mock-data";

export type WhatsappOrderDetails = {
  orderNumber: string;
  customer: { name: string; phone: string; address: string };
  items: { name: string; qty: number; price: number }[];
  /** Total at MRP, before discounts. */
  subtotal: number;
  discount: number;
  couponCode?: string | null;
  couponDiscount: number;
  shipping: number;
  total: number;
};

/** Builds the wa.me link that opens WhatsApp with the order pre-filled for the store owner. */
export function buildWhatsappOrderUrl(phoneDigits: string, o: WhatsappOrderDetails): string {
  const lines = [
    `*New Order ${o.orderNumber}*`,
    "",
    "*Items*",
    ...o.items.map((i, n) => `${n + 1}. ${i.name} × ${i.qty} = ${inr(i.price * i.qty)}`),
    "",
    `Subtotal: ${inr(o.subtotal)}`,
    ...(o.discount > 0 ? [`Discount: -${inr(o.discount)}`] : []),
    ...(o.couponDiscount > 0 ? [`Coupon (${o.couponCode ?? ""}): -${inr(o.couponDiscount)}`] : []),
    `Shipping: ${o.shipping ? inr(o.shipping) : "Free"}`,
    `*Total: ${inr(o.total)}*`,
    "",
    "*Customer*",
    `Name: ${o.customer.name}`,
    `Phone: ${o.customer.phone}`,
    `Address: ${o.customer.address}`,
    "",
    "Payment: Pay on WhatsApp (pending)",
  ];
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(lines.join("\n"))}`;
}

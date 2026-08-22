import stencilFloral from "@/assets/stencil-floral.jpg";
import stencilPeacock from "@/assets/stencil-peacock.jpg";
import stencilBridal from "@/assets/stencil-bridal.jpg";
import clipPearl from "@/assets/clip-pearl.jpg";
import clipFlower from "@/assets/clip-flower.jpg";

// Products/Categories now come from the PHP API — see src/lib/catalog.ts and catalog-store.tsx.
// Order history below is still static (out of scope for the catalog migration).

export type MockOrder = {
  id: string;
  date: string;
  total: number;
  status: "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: { name: string; image: string; qty: number }[];
};

export const mockOrders: MockOrder[] = [
  {
    id: "NS123456789",
    date: "20 May, 2026",
    total: 190,
    status: "Shipped",
    items: [
      { name: "Floral Finger Stencil", image: stencilFloral, qty: 1 },
      { name: "Peacock Design Stencil", image: stencilPeacock, qty: 1 },
      { name: "Pearl Hair Clip", image: clipPearl, qty: 1 },
    ],
  },
  {
    id: "NS123450123",
    date: "12 May, 2026",
    total: 249,
    status: "Delivered",
    items: [
      { name: "Bridal Design Stencil", image: stencilBridal, qty: 1 },
      { name: "Flower Hair Clip", image: clipFlower, qty: 1 },
    ],
  },
  {
    id: "NS123456378",
    date: "05 May, 2026",
    total: 129,
    status: "Delivered",
    items: [{ name: "Pearl Hair Clip", image: clipPearl, qty: 1 }],
  },
  {
    id: "NS123440099",
    date: "28 Apr, 2026",
    total: 79,
    status: "Cancelled",
    items: [{ name: "Bridal Design Stencil", image: stencilBridal, qty: 1 }],
  },
];

export const trackingSteps = [
  {
    label: "Order Placed",
    date: "20 May, 2026",
    time: "10:30 AM",
    eta: "Completed in 45 min",
    location: "Coimbatore, TN",
    note: "We received your order and sent a confirmation to your WhatsApp number.",
  },
  {
    label: "Order Confirmed",
    date: "20 May, 2026",
    time: "11:15 AM",
    eta: "Packed same day",
    location: "Nethra's Studio, Peelamedu",
    note: "Items quality-checked, wrapped in tissue and packed in our signature blush box.",
  },
  {
    label: "Shipped",
    date: "21 May, 2026",
    time: "09:40 AM",
    eta: "1 day in transit",
    location: "Coimbatore Hub",
    note: "Handed over to our courier partner. Tracking ID: NSX-88213-IN.",
  },
  {
    label: "Out for Delivery",
    date: "22 May, 2026",
    time: "08:20 AM",
    eta: "Arriving by 7:00 PM",
    location: "Gandhi Street, Peelamedu",
    note: "Rider Suresh (+91 90000 12345) is carrying your parcel. Keep your phone reachable.",
  },
  {
    label: "Delivered",
    date: "Expected 22 May",
    time: "By 7:00 PM",
    eta: "Awaiting delivery",
    location: "Your doorstep",
    note: "OTP will be requested at delivery. Unboxing video recommended for damage claims.",
  },
];


export const WHATSAPP_NUMBER = "919629427705";
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

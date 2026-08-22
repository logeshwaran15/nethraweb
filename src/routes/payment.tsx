import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, CreditCard, Landmark, Smartphone, ShieldCheck } from "lucide-react";
import { inr } from "@/lib/mock-data";
import { Screen } from "@/components/shop/AppChrome";
import { useShop } from "@/lib/shop-store";
import { showToast } from "@/lib/toast";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Payment — Nethra's" },
      { name: "description", content: "Choose UPI, card, net banking or cash on delivery." },
      { property: "og:title", content: "Payment — Nethra's" },
      { property: "og:description", content: "Choose your preferred payment method." },
    ],
  }),
  component: PaymentPage,
});

const methods = [
  { id: "upi", icon: Smartphone, name: "UPI", sub: "Google Pay, PhonePe, Paytm" },
  { id: "card", icon: CreditCard, name: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay" },
  { id: "net", icon: Landmark, name: "Net Banking", sub: "All major banks" },
  { id: "cod", icon: Banknote, name: "Cash on Delivery", sub: "Pay when you receive" },
];

const methodLabels: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  net: "Net Banking",
  cod: "COD",
};

function PaymentPage() {
  const navigate = useNavigate();
  const { total, subtotal, discount, cart, placeOrder } = useShop();
  const [selected, setSelected] = useState("upi");
  const [coupon, setCoupon] = useState("");
  const [placing, setPlacing] = useState(false);

  const pay = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const order = await placeOrder(methodLabels[selected] ?? selected);
      navigate({ to: "/order-success", search: { order: order.orderKey } });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to place order", "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Screen title="Payment" back>
      <div className="space-y-5 p-4">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-display text-lg font-semibold text-primary">Payment Method</h3>
          <div className="mt-3 space-y-2">
            {methods.map(({ id, icon: Icon, name, sub }) => (
              <button
                key={id}
                onClick={() => setSelected(id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left ${
                  selected === id ? "border-primary bg-accent" : "border-border"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{name}</span>
                  <span className="block text-[11px] text-muted-foreground">{sub}</span>
                </span>
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    selected === id ? "border-primary" : "border-border"
                  }`}
                >
                  {selected === id && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Have a coupon code?</p>
          <div className="mt-2 flex gap-2">
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter coupon code"
              className="min-w-0 flex-1 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none"
            />
            <button className="shrink-0 rounded-xl bg-gold px-4 text-xs font-bold text-primary">
              Apply
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{inr(subtotal + discount)}</span>
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-success">-{inr(discount)}</span>
          </div>
          <div className="mt-1.5 flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>Free</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">{inr(total)}</span>
          </div>
        </section>

        <button
          onClick={pay}
          disabled={placing || cart.length === 0}
          className="w-full rounded-full gradient-maroon py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] disabled:opacity-60"
        >
          {placing ? "Placing order…" : `Pay ${inr(total)}`}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> Demo only · No real payment is processed
        </p>
      </div>
    </Screen>
  );
}

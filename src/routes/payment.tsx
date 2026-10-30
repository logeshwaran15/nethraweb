import { lineKey } from "@/lib/catalog";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CreditCard,
  Loader2,
  Lock,
  PartyPopper,
  ShieldCheck,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { inr } from "@/lib/mock-data";
import { PaymentIcons } from "@/components/shop/PaymentIcons";
import { Screen } from "@/components/shop/AppChrome";
import { useShop } from "@/lib/shop-store";
import { useAuth } from "@/lib/auth-store";
import { showToast } from "@/lib/toast";
import { payWithRazorpay } from "@/lib/razorpay";
import { useCheckoutOptions } from "@/lib/checkout-options";
import { buildWhatsappOrderUrl } from "@/lib/whatsapp-order";
import { WhatsAppIcon } from "@/components/shop/WhatsAppIcon";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    total,
    subtotal,
    discount,
    couponCode,
    couponDiscount,
    shipping,
    cart,
    placeOrder,
    shippingInfo,
  } = useShop();
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user) {
      showToast("Please sign in to place your order", "error");
      navigate("/account");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const options = useCheckoutOptions();
  const canWhatsapp = options.whatsappOrderEnabled && !!options.whatsappNumber;
  const [chosen, setChosen] = useState<"razorpay" | "whatsapp" | null>(null);
  // Fall back to the first enabled method until the customer picks one.
  const method =
    chosen === "razorpay" && options.razorpayEnabled
      ? "razorpay"
      : chosen === "whatsapp" && canWhatsapp
        ? "whatsapp"
        : options.razorpayEnabled
          ? "razorpay"
          : canWhatsapp
            ? "whatsapp"
            : null;

  const orderOnWhatsapp = async () => {
    if (cart.length === 0 || !canWhatsapp) return;
    setPlacing(true);
    // Open the tab inside the click handler so popup blockers allow it; its URL is set after the order is saved.
    const tab = window.open("", "_blank");
    try {
      const details = {
        customer: {
          name: shippingInfo.fullName,
          phone: shippingInfo.phone,
          address: `${shippingInfo.address}${shippingInfo.landmark ? ", " + shippingInfo.landmark : ""}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pincode}`,
        },
        items: cart.map((c) => ({ name: c.product.name, qty: c.qty, price: c.product.price })),
        subtotal: subtotal + discount,
        discount,
        couponCode,
        couponDiscount,
        shipping,
        total,
      };
      const order = await placeOrder("WhatsApp");
      const url = buildWhatsappOrderUrl(options.whatsappNumber, {
        ...details,
        orderNumber: order.orderNumber,
      });
      if (tab) tab.location.href = url;
      else window.open(url, "_blank");
      navigate(`/order-success?order=${order.orderKey}`);
    } catch (err) {
      tab?.close();
      showToast(err instanceof Error ? err.message : "Failed to place order", "error");
    } finally {
      setPlacing(false);
    }
  };

  const pay = async () => {
    if (cart.length === 0) return;
    setPlacing(true);
    try {
      const razorpayPayment = await payWithRazorpay({
        amount: total,
        name: shippingInfo.fullName,
        email: shippingInfo.email,
        phone: shippingInfo.phone,
        description: `Order for ${cart.length} item(s)`,
      });

      const order = await placeOrder("Razorpay", {
        razorpayOrderId: razorpayPayment.razorpayOrderId,
        razorpayPaymentId: razorpayPayment.razorpayPaymentId,
      });
      navigate(`/order-success?order=${order.orderKey}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to place order", "error");
    } finally {
      setPlacing(false);
    }
  };

  const itemCount = cart.reduce((n, c) => n + c.qty, 0);
  const saved = discount + couponDiscount;
  const cardCls =
    "rounded-xl border border-[#E9DADA] bg-white shadow-[0_1px_8px_rgba(45,37,37,0.04)]";

  return (
    <Screen title="Payment" back>
      <div className="bg-[#FFF9F5] px-4 pb-10 pt-5 md:px-8 md:pt-8">
        <div className="mx-auto max-w-[1240px]">
          {/* Progress */}
          <ol
            className="mx-auto mb-6 flex max-w-[760px] items-center justify-center gap-2 text-sm font-semibold sm:gap-3"
            aria-label="Checkout progress"
          >
            {[
              { n: 1, label: "Payment", active: true },
              { n: 2, label: "Review", active: false },
              { n: 3, label: "Complete", active: false },
            ].map((s, i) => (
              <li
                key={s.n}
                className="flex flex-1 items-center gap-2 last:flex-none sm:gap-3"
                aria-current={s.active ? "step" : undefined}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    s.active ? "bg-[#8E1828] text-white" : "bg-[#EFE6E6] text-[#786B6B]"
                  }`}
                >
                  {s.n}
                </span>
                <span className={s.active ? "text-[#8E1828]" : "text-[#786B6B]"}>{s.label}</span>
                {i < 2 && (
                  <span className={`h-px flex-1 ${s.active ? "bg-[#8E1828]" : "bg-[#E9DADA]"}`} />
                )}
              </li>
            ))}
          </ol>

          <div className="md:grid md:grid-cols-[minmax(0,62fr)_minmax(0,38fr)] md:items-start md:gap-6">
            {/* Left: payment */}
            <section className={`${cardCls} p-5 md:p-7`}>
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
                  <CreditCard className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="font-display text-2xl font-semibold leading-tight text-[#2D2525]">
                    Choose Payment Method
                  </h1>
                  <p className="text-sm text-[#786B6B]">Choose how you want to order</p>
                </div>
              </div>

              {options.loaded && !method && (
                <div className="mt-5 rounded-xl bg-[#FDF0F0] px-5 py-6 text-center text-sm text-[#786B6B]">
                  No payment method is available right now. Please contact the store.
                </div>
              )}

              <div className="mt-5 space-y-3">
                {options.razorpayEnabled && (
                  <button
                    type="button"
                    onClick={() => setChosen("razorpay")}
                    className={`block w-full rounded-xl border-2 p-4 text-left md:p-5 ${
                      method === "razorpay"
                        ? "border-[#8E1828] bg-[#FFF7F7]"
                        : "border-[#E9DADA] bg-white hover:border-[#8E1828]/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[#8E1828]">
                        {method === "razorpay" && (
                          <span className="h-3 w-3 rounded-full bg-[#8E1828]" />
                        )}
                      </span>
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#FDF0F0] text-[#8E1828]">
                        <CreditCard className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-[#2D2525]">Razorpay</p>
                        <p className="text-sm text-[#786B6B]">
                          UPI • Credit/Debit Card • Net Banking • Wallets
                        </p>
                      </div>
                    </div>
                    <PaymentIcons className="mt-4 md:pl-[5.5rem]" />
                  </button>
                )}

                {canWhatsapp && (
                  <button
                    type="button"
                    onClick={() => setChosen("whatsapp")}
                    className={`block w-full rounded-xl border-2 p-4 text-left md:p-5 ${
                      method === "whatsapp"
                        ? "border-[#1FA855] bg-[#F1FBF5]"
                        : "border-[#E9DADA] bg-white hover:border-[#1FA855]/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[#1FA855]">
                        {method === "whatsapp" && (
                          <span className="h-3 w-3 rounded-full bg-[#1FA855]" />
                        )}
                      </span>
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#E4F7EC] text-[#1FA855]">
                        <WhatsAppIcon className="h-7 w-7" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-bold text-[#2D2525]">Order on WhatsApp</p>
                        <p className="text-sm text-[#786B6B]">
                          Your order is saved and the details are sent to us on WhatsApp.
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {method === "razorpay" && (
                <div className="mt-4 flex items-center gap-4 rounded-xl bg-[#FDF0F0] px-5 py-4">
                  <ShieldCheck className="h-8 w-8 shrink-0 text-[#8E1828]" />
                  <div>
                    <p className="text-sm font-bold text-[#8E1828]">Secure Online Payment</p>
                    <p className="text-[13px] text-[#786B6B]">
                      Pay safely using UPI, Cards, Net Banking or Wallets through Razorpay.
                    </p>
                  </div>
                </div>
              )}

              {method && (
                <button
                  onClick={method === "whatsapp" ? orderOnWhatsapp : pay}
                  disabled={placing || cart.length === 0}
                  className={`mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full text-lg font-semibold text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                    method === "whatsapp"
                      ? "bg-[#1FA855] shadow-[0_4px_14px_rgba(31,168,85,0.3)] hover:bg-[#188645] focus-visible:outline-[#1FA855]"
                      : "bg-[#8E1828] shadow-[0_4px_14px_rgba(142,24,40,0.25)] hover:bg-[#741421] focus-visible:outline-[#8E1828]"
                  }`}
                >
                  {placing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />{" "}
                      {method === "whatsapp" ? "Placing Order…" : "Processing Payment…"}
                    </>
                  ) : method === "whatsapp" ? (
                    <>
                      <WhatsAppIcon className="h-6 w-6" /> Order on WhatsApp · {inr(total)}
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" /> Pay {inr(total)} Securely
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </>
                  )}
                </button>
              )}
              {method === "razorpay" && (
                <p className="mt-4 flex items-center justify-center gap-2 text-sm text-[#786B6B]">
                  <ShieldCheck className="h-4 w-4" /> Payments are secured by Razorpay
                </p>
              )}
            </section>

            {/* Right column */}
            <div className="mt-5 space-y-5 md:sticky md:top-6 md:mt-0">
              <aside className={`${cardCls} p-5 md:p-6`}>
                <div className="flex items-center justify-between border-b border-[#E9DADA] pb-4">
                  <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-[#2D2525]">
                    <ShoppingCart className="h-5 w-5 text-[#8E1828]" /> Order Summary
                  </h2>
                  <span className="rounded-full bg-[#FDF0F0] px-3 py-1 text-xs font-semibold text-[#8E1828]">
                    {itemCount} Item{itemCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="space-y-4 border-b border-[#E9DADA] py-4">
                  {cart.map(({ product, qty }) => (
                    <div key={lineKey(product)} className="flex items-center gap-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        width={800}
                        height={800}
                        className="h-[68px] w-[68px] shrink-0 rounded-lg bg-[#FFF7F7] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2D2525]">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-[#786B6B]">Qty: {qty}</p>
                      </div>
                      <span className="text-sm font-semibold text-[#2D2525]">
                        {inr(product.price * qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 border-b border-[#E9DADA] py-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#786B6B]">Subtotal</span>
                    <span className="font-semibold">{inr(subtotal + discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786B6B]">Discount</span>
                    <span className="font-semibold text-[#2E9B61]">- {inr(discount)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#786B6B]">Coupon ({couponCode})</span>
                      <span className="font-semibold text-[#2E9B61]">- {inr(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#786B6B]">Shipping</span>
                    <span className="font-semibold">{shipping ? inr(shipping) : "Free"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-4">
                  <span className="text-base font-bold text-[#2D2525]">Total Amount</span>
                  <span className="text-[32px] font-bold leading-none text-[#8E1828]">
                    {inr(total)}
                  </span>
                </div>

                {saved > 0 && (
                  <div className="flex items-center gap-4 rounded-xl bg-[#FDF0F0] px-4 py-3.5">
                    <Tag className="h-7 w-7 shrink-0 text-[#8E1828]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#8E1828]">You saved {inr(saved)}!</p>
                      <p className="text-xs text-[#786B6B]">
                        Great choice! Enjoy your special discount.
                      </p>
                    </div>
                    <PartyPopper className="h-7 w-7 shrink-0 text-[#C9A34A]" />
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

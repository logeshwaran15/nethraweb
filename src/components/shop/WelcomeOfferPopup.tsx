import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Gift, X } from "lucide-react";
import { apiGet } from "@/lib/api";

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

const SEEN_KEY = "nethras_welcome_offer_seen";
// Coupon codes (set up in Admin → Coupons) that count as the first-order offer.
const OFFER_PATTERN = /first|welcome|new/i;

function isUsable(c: CouponRow) {
  if (Number(c.IsActive) !== 1) return false;
  if (c.ExpiryOn && new Date(c.ExpiryOn) < new Date()) return false;
  if (c.UsageLimit > 0 && c.UsageCount >= c.UsageLimit) return false;
  return true;
}

export function WelcomeOfferPopup() {
  const [coupon, setCoupon] = useState<CouponRow | null>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      /* storage unavailable: still show once per page load */
    }
    let timer: ReturnType<typeof setTimeout>;
    apiGet<CouponRow[]>("/api/coupons.php")
      .then((rows) => {
        const match = rows.find((c) => isUsable(c) && OFFER_PATTERN.test(c.Code));
        if (!match) return;
        setCoupon(match);
        timer = setTimeout(() => setOpen(true), 1500);
      })
      .catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !coupon) return null;

  const value = Number(coupon.Value);
  const offer = coupon.DiscountType === "percent" ? `${value}% OFF` : `₹${value} OFF`;
  const minOrder = Number(coupon.MinOrderAmount);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.Code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="First order discount"
    >
      <div
        className="relative w-full max-w-[380px] overflow-hidden rounded-3xl bg-white text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#2D2525] hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="bg-gradient-to-br from-[#8E1828] to-[#B5314A] px-6 pb-7 pt-9 text-white">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/15">
            <Gift className="h-7 w-7" />
          </span>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/80">
            Welcome to Nethra&apos;s
          </p>
          <p className="mt-1 font-display text-4xl font-semibold">{offer}</p>
          <p className="mt-1 text-sm text-white/90">on your first order</p>
        </div>

        <div className="px-6 pb-6 pt-5">
          <p className="text-xs text-[#786B6B]">Use this code at checkout</p>
          <button
            onClick={copy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#8E1828] bg-[#FDF0F0] px-4 py-3 text-lg font-bold tracking-[0.2em] text-[#8E1828]"
          >
            {coupon.Code}
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          {minOrder > 0 && (
            <p className="mt-2 text-[11px] text-[#786B6B]">Valid on orders above ₹{minOrder}</p>
          )}

          <Link
            to="/categories"
            onClick={close}
            className="mt-4 flex h-11 items-center justify-center rounded-full bg-[#8E1828] text-sm font-semibold text-white hover:bg-[#741421]"
          >
            Shop Now
          </Link>
          <button onClick={close} className="mt-3 text-xs text-[#786B6B] underline">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  CreditCard,
  FileText,
  Headphones,
  Mail,
  PencilLine,
  RotateCcw,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import aboutsHero from "@/assets/abouts.png";
import { Screen } from "@/components/shop/AppChrome";
import { Button } from "@/components/ui/button";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By accessing or placing an order on Nethra's, you agree to these Terms & Conditions. If you do not agree, please do not use the website.",
    ],
  },
  {
    title: "2. Products & Pricing",
    body: [
      "We sell mehandi stencils and accessories. Product images are for illustration; slight variations in colour, size or finish may occur.",
      "All prices are in Indian Rupees (₹) and may change without prior notice. The price shown at the time you place your order is the price you pay.",
      "We reserve the right to limit quantities or cancel orders in case of pricing errors or stock unavailability, with a full refund of any amount paid.",
    ],
  },
  {
    title: "3. Accounts",
    body: [
      "You are responsible for keeping your login details confidential and for all activity under your account. Please provide accurate name, phone number and address details so we can deliver your order.",
    ],
  },
  {
    title: "4. Orders & Payments",
    body: [
      "An order is confirmed only after successful payment. Payments are processed securely through Razorpay; we do not store your card or UPI details.",
      "Coupon codes are valid only as stated (minimum order value, expiry and usage limits) and cannot be combined unless mentioned otherwise.",
    ],
  },
  {
    title: "5. Shipping & Delivery",
    body: [
      "Delivery charges and estimated timelines depend on your delivery location and are shown at checkout. Delivery dates are estimates and may be affected by courier delays or events beyond our control.",
    ],
  },
  {
    title: "6. Cancellations, Returns & Refunds",
    body: [
      "Orders can be cancelled before they are shipped. Once shipped, cancellation is not possible.",
      "If you receive a damaged, defective or incorrect item, contact us within 48 hours of delivery with photos and your order number. We will replace the item or refund you after verification.",
      "Approved refunds are returned to the original payment method within 5–7 working days.",
    ],
  },
  {
    title: "7. Use of the Website",
    body: [
      "You agree not to misuse the site, attempt unauthorised access, or use it for any unlawful purpose. Content, logos and designs on this site belong to Nethra's and may not be copied without permission.",
    ],
  },
  {
    title: "8. Limitation of Liability",
    body: [
      "To the extent permitted by law, Nethra's is not liable for indirect or consequential losses arising from the use of our products or website. Our liability is limited to the value of the order concerned.",
    ],
  },
  {
    title: "9. Changes to These Terms",
    body: [
      "We may update these Terms from time to time. Continued use of the website after changes means you accept the updated Terms.",
    ],
  },
  {
    title: "10. Contact",
    body: [
      "For any questions about these Terms, please reach us using the email or phone number listed in the footer of this website.",
    ],
  },
];

const ICONS: LucideIcon[] = [
  FileText,
  ShoppingCart,
  UserRound,
  CreditCard,
  Truck,
  RotateCcw,
  ShieldCheck,
  Scale,
  PencilLine,
  Mail,
];

const sectionId = (i: number) => `terms-section-${i + 1}`;
const stripNumber = (title: string) => title.replace(/^\d+\.\s*/, "");

export default function TermsPage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(Number(visible.target.getAttribute("data-index")));
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    SECTIONS.forEach((_, i) => {
      const el = document.getElementById(sectionId(i));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Screen title="Terms & Conditions" back>
      <div className="overflow-x-hidden bg-[#FFF9F5]">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#FFF9F5] via-[#FDF0F0] to-[#FBE3E3]">
          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 md:px-8 md:py-12 lg:grid-cols-2">
            <div className="min-w-0">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-[#8E1828]">
                Terms &amp; Conditions
                <span aria-hidden className="h-px w-10 bg-[#8E1828]/40" />
              </p>
              <h1 className="mt-3 break-words font-display text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight text-[#8E1828]">
                Terms &amp; Conditions
              </h1>
              <p className="mt-2 text-xs text-[#786B6B]">Last updated: October 2026</p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#786B6B] md:text-base">
                Please read these Terms &amp; Conditions carefully before using our website.
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#786B6B] md:text-base">
                By accessing or placing an order on Nethra&apos;s, you agree to these terms.
              </p>
            </div>
            <img
              src={aboutsHero}
              alt="Mehandi stencils and henna art"
              className="aspect-[16/9] w-full rounded-3xl object-cover object-[75%_50%] shadow-[0_8px_24px_rgba(45,37,37,0.12)]"
            />
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:px-8 md:py-12 lg:grid-cols-[17rem_1fr]">
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <nav
              aria-label="Terms sections"
              className="rounded-2xl border border-[#E9DADA] bg-[#FDF0F0]/70 p-2"
            >
              <ul className="flex gap-1 overflow-x-auto lg:block lg:space-y-1 lg:overflow-visible">
                {SECTIONS.map((s, i) => {
                  const Icon = ICONS[i] ?? FileText;
                  const isActive = active === i;
                  return (
                    <li key={s.title} className="shrink-0 lg:shrink">
                      <a
                        href={`#${sectionId(i)}`}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#8E1828] ${
                          isActive
                            ? "bg-white font-semibold text-[#8E1828] shadow-sm"
                            : "text-[#2D2525] hover:bg-white/60"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-[#8E1828]" />
                        <span className="whitespace-nowrap lg:whitespace-normal">
                          {stripNumber(s.title)}
                        </span>
                        <ChevronRight
                          aria-hidden
                          className="ml-auto hidden h-4 w-4 shrink-0 text-[#786B6B] lg:block"
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="grid min-w-0 gap-4 md:grid-cols-2 md:items-start">
            {SECTIONS.map((s, i) => (
              <section
                key={s.title}
                id={sectionId(i)}
                data-index={i}
                className="scroll-mt-24 rounded-2xl border border-[#E9DADA] bg-white p-5 shadow-[0_1px_8px_rgba(45,37,37,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#FDF0F0] text-sm font-semibold text-[#8E1828]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="min-w-0 break-words pt-1 font-display text-lg font-semibold text-[#8E1828]">
                    {stripNumber(s.title)}
                  </h2>
                </div>
                <div className="mt-3 space-y-2">
                  {s.body.map((p, j) => (
                    <p key={j} className="break-words text-sm leading-relaxed text-[#786B6B]">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Support CTA */}
        <section className="bg-gradient-to-r from-[#FDF0F0] via-[#FFF9F5] to-[#FDF0F0] px-4 py-10 text-center md:py-14">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-[#8E1828] shadow-sm">
            <Headphones className="h-6 w-6" />
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#8E1828]">
            Still have questions?
          </p>
          <h2 className="mt-2 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-semibold text-[#8E1828]">
            We&apos;re Here to Help
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#786B6B]">
            Feel free to reach out to us for any clarifications.
          </p>
          <Button asChild variant="brand" size="ctaLg" className="mt-5 min-h-11">
            <Link to="/contact">Contact Us</Link>
          </Button>
        </section>
      </div>
    </Screen>
  );
}

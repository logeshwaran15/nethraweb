import { useEffect, useState } from "react";
import {
  ChevronRight,
  Clock,
  Headphones,
  Heart,
  Mail,
  MapPin,
  Phone,
  Send,
  ShoppingBag,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { Screen } from "@/components/shop/AppChrome";
import { apiGet } from "@/lib/api";
import { usePageSeo } from "@/lib/use-page-seo";

type ContactRow = {
  SupportEmail: string | null;
  SupportPhone: string | null;
  WhatsappNumber: string | null;
  Address: string | null;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

const cardCls =
  "rounded-2xl border border-[#E9DADA] bg-[#FDF0F0]/70 p-4 shadow-[0_1px_8px_rgba(45,37,37,0.04)]";
const labelCls = "mb-1 block text-xs font-semibold text-[#2D2525]";
const inputCls =
  "min-h-11 w-full rounded-xl border border-[#E9DADA] bg-[#FFF9F5] px-4 py-2.5 text-sm outline-none placeholder:text-[#786B6B] focus:border-[#8E1828] focus:ring-4 focus:ring-[#FDF0F0]";

const BENEFITS = [
  { icon: Headphones, title: "Friendly Support", text: "We're always here to help" },
  { icon: ShoppingBag, title: "Order Assistance", text: "Get help with orders & tracking" },
  { icon: Heart, title: "Made with Care", text: "Your happiness means everything" },
];

export default function ContactPage() {
  const [contact, setContact] = useState<ContactRow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNo, setOrderNo] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGet<ContactRow>("/api/contact_settings.php")
      .then(setContact)
      .catch(() => setContact(null));
  }, []);

  const waNumber = (contact?.WhatsappNumber ?? contact?.SupportPhone ?? "").replace(/\D/g, "");

  usePageSeo(
    "Contact Us",
    ["Get in touch with Nethra's", contact?.SupportEmail, contact?.SupportPhone]
      .filter(Boolean)
      .join(" · "),
  );

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text =
      `Hi Nethra's, I'm ${name}${phone ? ` (${phone})` : ""}.` +
      (email ? `\nEmail: ${email}` : "") +
      (orderNo ? `\nOrder No: ${orderNo}` : "") +
      `\n\n${message}`;
    if (waNumber) {
      window.open(
        `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener",
      );
    } else if (contact?.SupportEmail) {
      window.location.href = `mailto:${contact.SupportEmail}?subject=${encodeURIComponent(
        "Enquiry from " + name,
      )}&body=${encodeURIComponent(text)}`;
    }
  };

  const items = [
    contact?.WhatsappNumber && {
      icon: WhatsAppIcon,
      label: "WhatsApp",
      desc: "Get quick assistance on orders, products or custom designs.",
      value: contact.WhatsappNumber,
      href: `https://wa.me/${waNumber}`,
    },
    contact?.SupportEmail && {
      icon: Mail,
      label: "Email Us",
      desc: "Drop us an email and we'll get back to you soon.",
      value: contact.SupportEmail,
      href: `mailto:${contact.SupportEmail}`,
    },
    contact?.SupportPhone && {
      icon: Phone,
      label: "Call Us",
      desc: "Speak to us directly about your enquiry.",
      value: contact.SupportPhone,
      href: `tel:${contact.SupportPhone}`,
    },
    contact?.Address && {
      icon: MapPin,
      label: "Visit Us",
      desc: "",
      value: contact.Address,
      href: "",
    },
  ].filter(Boolean) as {
    icon: React.ElementType;
    label: string;
    desc: string;
    value: string;
    href: string;
  }[];

  return (
    <Screen title="Contact Us" back>
      <div className="overflow-x-hidden bg-[#FFF9F5]">
        <section className="relative bg-gradient-to-b from-[#FFF9F5] to-[#FDF0F0] px-4 py-8 text-center md:py-12">
          <p className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-widest text-[#8E1828]">
            <span aria-hidden className="h-px w-8 bg-[#8E1828]/40 md:w-12" />
            Contact Us
            <span aria-hidden className="h-px w-8 bg-[#8E1828]/40 md:w-12" />
          </p>
          <h1 className="mt-3 break-words font-display text-[clamp(1.75rem,5vw,3rem)] font-semibold leading-tight text-[#8E1828]">
            We&apos;d Love to Hear From You
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#786B6B] md:text-base">
            Questions, ideas, or a little help with your order? We&apos;re here for you.
          </p>
        </section>

        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:grid-cols-2 md:px-8 md:py-10 lg:grid-cols-[1fr_1fr_1.15fr]">
          <img
            src={heroImg}
            alt="Mehandi stencils and henna art"
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-[0_8px_24px_rgba(45,37,37,0.12)] md:col-span-2 lg:col-span-1 lg:aspect-auto lg:h-full lg:max-h-[34rem]"
          />

          <div className="min-w-0 space-y-3">
            {items.map((it) => {
              const body = (
                <>
                  <span
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${
                      it.label === "WhatsApp" ? "bg-[#25D366] text-white" : "bg-white text-[#8E1828]"
                    }`}
                  >
                    <it.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-semibold text-[#8E1828]">
                      {it.label}
                    </span>
                    {it.desc && <span className="block text-xs text-[#786B6B]">{it.desc}</span>}
                    <span className="mt-1 block break-words text-sm font-semibold text-[#2D2525]">
                      {it.value}
                    </span>
                  </span>
                  {it.href && (
                    <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-[#786B6B]" />
                  )}
                </>
              );
              return it.href ? (
                <a
                  key={it.label}
                  href={it.href}
                  className={`${cardCls} flex items-center gap-4 transition-colors hover:border-[#8E1828]`}
                >
                  {body}
                </a>
              ) : (
                <div key={it.label} className={`${cardCls} flex items-center gap-4`}>
                  {body}
                </div>
              );
            })}
            {contact && items.length === 0 && (
              <p className="text-sm text-[#786B6B]">Contact details will be available soon.</p>
            )}
            {contact && (
              <div className={`${cardCls} flex items-center gap-4`}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#8E1828]">
                  <Clock className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base font-semibold text-[#8E1828]">
                    Support Hours
                  </span>
                  <span className="block text-xs text-[#786B6B]">
                    We&apos;re here to help with your enquiries.
                  </span>
                </span>
              </div>
            )}
          </div>

          <form
            onSubmit={send}
            className="min-w-0 space-y-3 rounded-2xl border border-[#E9DADA] bg-white p-5 shadow-[0_1px_8px_rgba(45,37,37,0.06)] md:col-span-2 lg:col-span-1"
          >
            <h2 className="font-display text-xl font-semibold text-[#8E1828]">Send us a message</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="c-name" className={labelCls}>
                  Your Name <span className="text-[#8E1828]">*</span>
                </label>
                <input
                  id="c-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  autoComplete="name"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="c-email" className={labelCls}>
                  Email Address (Optional)
                </label>
                <input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="c-phone" className={labelCls}>
                  Phone Number (Optional)
                </label>
                <input
                  id="c-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="c-order" className={labelCls}>
                  Order Number (Optional)
                </label>
                <input
                  id="c-order"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="Enter your order number"
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label htmlFor="c-message" className={labelCls}>
                Message <span className="text-[#8E1828]">*</span>
              </label>
              <textarea
                id="c-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you?"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white ${
                waNumber ? "bg-[#25D366] hover:bg-[#1EBE5A]" : "bg-[#8E1828] hover:bg-[#741421]"
              }`}
            >
              {waNumber ? <WhatsAppIcon className="h-5 w-5" /> : <Send className="h-4 w-4" />}{" "}
              {waNumber ? "Send on WhatsApp" : "Send Message"}
            </button>
          </form>
        </div>

        <section className="bg-[#FDF0F0] px-4 py-6 md:px-8">
          <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#E9DADA]">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3 sm:justify-center sm:px-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#8E1828]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base font-semibold text-[#8E1828]">
                    {title}
                  </span>
                  <span className="block text-xs text-[#786B6B]">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Screen>
  );
}

import { useEffect, useState } from "react";
import { FileText, Heart, MapPin, Phone, Printer, Truck } from "lucide-react";
import logo from "@/assets/newlogo.jpeg";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api";
import { inr } from "@/lib/mock-data";

type ContactRow = {
  SupportEmail: string | null;
  SupportPhone: string | null;
  Address: string | null;
};

function useShopContact() {
  const [contact, setContact] = useState<{ email: string; phone: string; address: string } | null>(
    null,
  );
  useEffect(() => {
    apiGet<ContactRow>("/api/contact_settings.php")
      .then((r) =>
        setContact({
          email: r.SupportEmail ?? "",
          phone: r.SupportPhone ?? "",
          address: r.Address ?? "",
        }),
      )
      .catch(() => setContact(null));
  }, []);
  return contact;
}

export type InvoiceOrder = {
  orderNumber: string;
  createdOn: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
};

export type InvoiceItem = {
  name: string;
  qty: number;
  price: number;
};

const DASH = "border-[#CFC5C5]";
const LABEL = "text-[11px] font-medium uppercase tracking-[0.18em] text-[#756969]";

export function OrderInvoice({
  order,
  items,
  showPrintButton = true,
}: {
  order: InvoiceOrder;
  items: InvoiceItem[];
  showPrintButton?: boolean;
}) {
  const contact = useShopContact();

  const invoiceDate = new Date(order.createdOn).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const infoRows = [
    { k: "Order Number", v: <span className="font-bold">{order.orderNumber}</span> },
    { k: "Invoice Date", v: <span className="font-bold">{invoiceDate}</span> },
    {
      k: "Payment Status",
      v: (
        <span
          className={`inline-block rounded-full px-4 py-1 text-sm font-semibold ${
            order.paymentStatus === "Paid"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-[#F6EBCB] text-[#8E1828]"
          }`}
        >
          {order.paymentStatus || order.paymentMethod}
        </span>
      ),
    },
  ];

  const highlights = [
    { icon: FileText, text: "Quality Products" },
    { icon: Truck, text: "Secure Shipping" },
    { icon: Heart, text: "Your Support Means a Lot" },
  ];

  return (
    <div>
      <style>{`@media print {
        @page { size: A4; margin: 12mm; }
        #invoice { box-shadow: none !important; border: 0 !important; border-radius: 0 !important; max-width: none !important; }
        #invoice, #invoice * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #invoice .inv-keep { break-inside: avoid; page-break-inside: avoid; }
      }`}</style>

      {showPrintButton && (
        <div className="mx-auto mb-3 flex max-w-[880px] justify-end print:hidden">
          <Button onClick={() => window.print()} variant="brandOutline" size="sm">
            <Printer className="h-3.5 w-3.5" /> Print / Save
          </Button>
        </div>
      )}

      <div
        id="invoice"
        className="mx-auto max-w-[880px] overflow-hidden rounded-md border border-[#ECE4E4] bg-white text-[#2B2525] shadow-[0_2px_18px_rgba(43,37,37,0.07)]"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 px-4 pb-5 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-5 sm:px-10 sm:pb-6 sm:pt-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center sm:h-[76px] sm:w-[76px] overflow-hidden rounded-full bg-[#FFE4E8] shadow-[0_0_0_2px_#C9A34A]">
              <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
            </span>
            <div>
              <p className="font-display text-[26px] font-medium leading-none text-[#8E1828] sm:text-[34px]">
                Nethra&apos;s
              </p>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-[#756969] sm:text-[11px] sm:tracking-[0.22em]">
                Mehandi Stencils &amp; Accessories
              </p>
              <p className="mt-1 text-[13px] italic text-[#8E1828]">
                Beautiful designs for your special moments
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="font-display text-2xl font-medium uppercase leading-none tracking-[0.25em] text-[#8E1828] sm:text-[34px] sm:tracking-[0.3em]">
              Invoice
            </p>
            <p className="mt-2 text-sm tracking-wide text-[#756969]">{order.orderNumber}</p>
          </div>
        </div>

        <div className={`mx-4 border-t border-dashed sm:mx-10 ${DASH}`} />

        {/* Bill to + order info */}
        <div className="inv-keep grid grid-cols-1 gap-5 px-4 py-5 sm:grid-cols-2 sm:gap-0 sm:px-10 sm:py-7">
          <div className="sm:pr-8">
            <p className="inline-block bg-[#FDF0F0] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2B2525]">
              Bill To
            </p>
            <p className="mt-4 text-lg font-bold">{order.shippingName ?? "—"}</p>
            {order.shippingPhone && (
              <p className="mt-2 flex items-center gap-2.5 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-[#8E1828]/70" /> {order.shippingPhone}
              </p>
            )}
            {order.shippingAddress && (
              <p className="mt-2 flex items-start gap-2.5 text-sm leading-relaxed">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8E1828]/70" />{" "}
                {order.shippingAddress}
              </p>
            )}
          </div>

          <dl
            className={`space-y-3.5 border-t border-dashed pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-1 ${DASH}`}
          >
            {infoRows.map((row) => (
              <div
                key={row.k}
                className="grid grid-cols-[104px_10px_1fr] items-center text-sm sm:grid-cols-[130px_12px_1fr]"
              >
                <dt className={LABEL}>{row.k}</dt>
                <dd className="text-[#756969]">:</dd>
                <dd>{row.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={`mx-4 border-t border-dashed sm:mx-10 ${DASH}`} />

        {/* Items */}
        <div className="inv-keep px-4 py-5 sm:hidden">
          <div className="mb-1 bg-[#FDF0F0] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5E5252]">
            Items
          </div>
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex items-start justify-between gap-3 border-b border-dashed px-1 py-3 ${DASH}`}
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold">
                  {i + 1}. {item.name}
                </p>
                <p className="mt-0.5 text-xs text-[#756969]">
                  {item.qty} × {inr(item.price)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold">{inr(item.price * item.qty)}</p>
            </div>
          ))}
        </div>
        <div className="inv-keep hidden px-10 py-6 sm:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FDF0F0]">
              <tr className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5E5252]">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3 text-right">Qty</th>
                <th className="px-3 py-3 text-right">Unit Price</th>
                <th className="px-3 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className={`border-b border-dashed ${DASH}`}>
                  <td className="px-3 py-4 text-[#756969]">{i + 1}</td>
                  <td className="px-3 py-4 font-semibold">{item.name}</td>
                  <td className="px-3 py-4 text-right">{item.qty}</td>
                  <td className="px-3 py-4 text-right">{inr(item.price)}</td>
                  <td className="px-3 py-4 text-right font-semibold">
                    {inr(item.price * item.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="inv-keep px-4 pb-6 sm:px-10 sm:pb-7">
          <div className="ml-auto w-full max-w-[320px]">
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-[#756969]">Subtotal</span>
              <span className="font-medium">{inr(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-sm">
              <span className="text-[#756969]">Shipping</span>
              <span className="font-medium">
                {order.shippingFee ? inr(order.shippingFee) : "Free"}
              </span>
            </div>
            <div className={`mt-2 border-t border-dashed pt-3 ${DASH}`}>
              <div className="flex items-center justify-between rounded-lg bg-[#FDF0F0] px-4 py-3">
                <span className="text-sm font-bold uppercase tracking-wider text-[#8E1828]">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-[#8E1828] sm:text-2xl">{inr(order.total)}</span>
              </div>
            </div>
          </div>

          {order.paymentReference && (
            <p className="mt-5 break-all text-center text-xs text-[#756969]">
              Payment Reference:{" "}
              <span className="font-mono font-semibold text-[#2B2525]">
                {order.paymentReference}
              </span>
            </p>
          )}
        </div>

        <div className={`mx-4 border-t border-dashed sm:mx-10 ${DASH}`} />

        {/* Thank you + highlights */}
        <div className="inv-keep flex flex-col gap-5 px-4 py-6 sm:flex-row sm:items-center sm:px-10 sm:py-7">
          <div className="sm:w-[42%]">
            <p
              className="font-display text-[34px] italic leading-none sm:text-[40px] text-[#8E1828]"
              style={{ fontStyle: "italic" }}
            >
              Thank you!
            </p>
            <p className={`mt-3 flex items-center gap-1.5 ${LABEL}`}>
              For shopping with Nethra&apos;s{" "}
              <Heart className="h-3 w-3 fill-[#8E1828] text-[#8E1828]" />
            </p>
          </div>
          <div
            className={`grid flex-1 grid-cols-3 gap-2 border-t border-dashed pt-5 sm:gap-4 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 ${DASH}`}
          >
            {highlights.map((h) => (
              <div key={h.text} className="flex flex-col items-center gap-2 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-[#F0D5D5] text-[#8E1828]">
                  <h.icon className="h-[18px] w-[18px]" />
                </span>
                <p className="text-xs font-medium text-[#5E5252]">{h.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#FDF0F0] px-4 py-3.5 text-center text-[10px] font-medium uppercase leading-relaxed tracking-[0.14em] sm:text-[11px] sm:tracking-[0.22em] text-[#5E5252]">
          Nethra&apos;s &bull; Mehandi Stencils &amp; Accessories
          {contact?.phone && <> &bull; {contact.phone}</>}
        </div>
      </div>
    </div>
  );
}

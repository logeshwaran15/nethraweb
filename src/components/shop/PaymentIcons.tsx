import { Landmark } from "lucide-react";

/** Row of supported-payment marks shown under the Razorpay card. Swap any entry for an official logo file if you add one to src/assets. */
export function PaymentIcons({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${className}`}
      aria-label="Supported payment methods: Google Pay, PhonePe, Paytm, Visa, Mastercard, RuPay and Net Banking"
    >
      <span className="flex h-9 items-center rounded-md border border-[#E9DADA] bg-white px-3 text-sm font-semibold text-[#5F6368]">
        <span className="font-bold">
          <span className="text-[#4285F4]">G</span>
        </span>
        <span className="ml-1">Pay</span>
      </span>

      <span
        className="grid h-9 w-9 place-items-center rounded-full bg-[#5F259F] text-sm font-extrabold text-white"
        title="PhonePe"
      >
        पे
      </span>

      <span className="text-lg font-extrabold italic tracking-tight" title="Paytm">
        <span className="text-[#002970]">pay</span>
        <span className="text-[#00BAF2]">tm</span>
      </span>

      <span className="text-xl font-extrabold italic tracking-tight text-[#1A1F71]" title="Visa">
        VISA
      </span>

      <svg width="40" height="26" viewBox="0 0 40 26" role="img" aria-label="Mastercard">
        <circle cx="14" cy="13" r="12" fill="#EB001B" />
        <circle cx="26" cy="13" r="12" fill="#F79E1B" />
        <path d="M20 3.6a12 12 0 0 1 0 18.8 12 12 0 0 1 0-18.8z" fill="#FF5F00" />
      </svg>

      <span
        className="flex items-center text-lg font-extrabold italic tracking-tight"
        title="RuPay"
      >
        <span className="text-[#1A3F8F]">Ru</span>
        <span className="text-[#1A3F8F]">Pay</span>
        <span className="ml-0.5 inline-block h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-[#F58220]" />
      </span>

      <Landmark className="h-7 w-7 text-[#1A1F71]" aria-label="Net Banking" />
    </div>
  );
}

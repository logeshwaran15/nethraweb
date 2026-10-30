import { useEffect, useState } from "react";
import { apiGet } from "./api";

export type CheckoutOptions = {
  loaded: boolean;
  razorpayEnabled: boolean;
  whatsappOrderEnabled: boolean;
  /** Digits only, country code included (e.g. 919876543210). Empty if not configured. */
  whatsappNumber: string;
};

type PaymentRow = { RazorpayEnabled: string | number; WhatsappOrderEnabled?: string | number };
type ContactRow = { WhatsappNumber: string | null };

/** Which ways of ordering the admin has switched on in Settings. */
export function useCheckoutOptions(): CheckoutOptions {
  const [opts, setOpts] = useState<CheckoutOptions>({
    loaded: false,
    razorpayEnabled: false,
    whatsappOrderEnabled: false,
    whatsappNumber: "",
  });

  useEffect(() => {
    Promise.all([
      apiGet<PaymentRow>("/api/payment_settings.php"),
      apiGet<ContactRow>("/api/contact_settings.php"),
    ])
      .then(([pay, contact]) =>
        setOpts({
          loaded: true,
          razorpayEnabled: Number(pay.RazorpayEnabled) === 1,
          whatsappOrderEnabled: Number(pay.WhatsappOrderEnabled) === 1,
          whatsappNumber: (contact.WhatsappNumber ?? "").replace(/\D/g, ""),
        }),
      )
      .catch(() => setOpts((o) => ({ ...o, loaded: true })));
  }, []);

  return opts;
}

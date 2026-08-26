import { apiPost } from "./api";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

type CreateOrderResponse = {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

type VerifyResponse = { verified: boolean };

export type RazorpaySuccess = { razorpayOrderId: string; razorpayPaymentId: string };

// Opens the Razorpay checkout popup for the given rupee amount, verifies the
// payment signature server-side, and resolves with the verified payment ids.
// Rejects (or the promise never settles, on user-cancel) if payment fails.
export function payWithRazorpay(options: {
  amount: number;
  name: string;
  email: string;
  phone: string;
  description: string;
}): Promise<RazorpaySuccess> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadCheckoutScript();
      const order = await apiPost<CreateOrderResponse>("/api/razorpay_order.php", {
        amount: options.amount,
      });

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Nethra's",
        description: options.description,
        order_id: order.razorpayOrderId,
        prefill: { name: options.name, email: options.email, contact: options.phone },
        theme: { color: "#7a1f3d" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await apiPost<VerifyResponse>("/api/razorpay_verify.php", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            resolve({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled")),
        },
      });
      rzp.open();
    } catch (err) {
      reject(err);
    }
  });
}

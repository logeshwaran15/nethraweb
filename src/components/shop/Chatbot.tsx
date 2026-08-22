import { Link } from "@tanstack/react-router";
import {
  CheckCheck,
  HelpCircle,
  Minus,
  MessageCircle,
  Package,
  RotateCcw,
  Search,
  Send,
  Truck,
  Volume2,
  VolumeX,
  X,
  Headphones,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/a889bf53-43d8-42fc-b779-723c8ec5cf32.png";

const quickReplies: { label: string; icon: LucideIcon }[] = [
  { label: "Track my order", icon: Package },
  { label: "Product details", icon: Search },
  { label: "Shipping info", icon: Truck },
  { label: "Return / Exchange", icon: RotateCcw },
  { label: "Talk to support", icon: Headphones },
  { label: "View FAQs", icon: HelpCircle },
];

const answers: Record<string, string> = {
  "Product details":
    "All our stencils are made from premium non-toxic, reusable material. Accessories are anti-tarnish gold tone.",
  "Shipping info":
    "Free shipping on orders above ₹999. Standard delivery takes 3-5 days, express 1-2 days.",
  "Return / Exchange":
    "Easy returns within 7 days of delivery. Just raise a request from My Orders.",
  "Talk to support":
    "Our team is on WhatsApp at +91 96294 27705, 10 AM – 7 PM, all days.",
  "View FAQs":
    "You can find answers to common questions on our Track Order and Orders pages, or just ask me here!",
};

type Msg = {
  from: "bot" | "user";
  text: string;
  time: string;
  orderId?: string | undefined;
};

const now = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [input, setInput] = useState("");
  const [awaitingOrderId, setAwaitingOrderId] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "Hi there! 👋 I'm Nethra's Assistant. How can I help you today?", time: now() },
  ]);

  const pushBot = (text: string, orderId?: string) =>
    setMessages((m) => [...m, { from: "bot", text, time: now(), orderId }]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { from: "user", text, time: now() }]);
    setInput("");

    if (awaitingOrderId) {
      setAwaitingOrderId(false);
      setTimeout(() => pushBot(`Great! 🎉 Your order ${text.trim()} is shipped.`, text.trim()), 300);
      return;
    }

    if (text === "Track my order") {
      setAwaitingOrderId(true);
      setTimeout(() => pushBot("Sure! Please share your order number."), 300);
      return;
    }

    setTimeout(
      () =>
        pushBot(
          answers[text] ??
            "Thanks for your message! Our team will reply shortly. Meanwhile you can chat with us on WhatsApp.",
        ),
      300,
    );
  };

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 md:right-[max(1rem,calc(50vw-232px))]">
        {!open && (
          <>
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40" />
            <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/20 blur-md" />
          </>
        )}
        <button
          aria-label={open ? "Close support chat" : "Open support chat"}
          onClick={() => setOpen((o) => !o)}
          className={`group grid h-13 w-13 place-items-center rounded-full gradient-maroon p-3.5 text-primary-foreground shadow-[var(--shadow-soft)] transition-transform duration-300 hover:scale-110 active:scale-95 ${
            open ? "" : "animate-bounce [animation-duration:2.5s]"
          }`}
        >
          <span
            className={`transition-transform duration-300 ${open ? "rotate-180 scale-90" : "rotate-0 group-hover:rotate-12"}`}
          >
            {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
          </span>
        </button>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-gold text-[9px] font-bold text-primary shadow-[var(--shadow-card)]">
            1
          </span>
        )}
      </div>

      {open && (
        <div
          className={`fixed inset-x-3 bottom-40 z-40 mx-auto flex w-auto max-w-[420px] origin-bottom-right animate-in fade-in slide-in-from-bottom-4 zoom-in-95 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] duration-300 ${
            minimized ? "" : "max-h-[68vh]"
          }`}
        >
          <div className="flex items-center gap-2 gradient-maroon px-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/30 bg-white/10">
              <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold text-primary-foreground">
                Nethra's Assistant
              </p>
              <p className="flex items-center gap-1 text-[11px] text-primary-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> We are online
              </p>
            </div>
            <button
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted((v) => !v)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-primary-foreground/90 hover:bg-white/10"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              aria-label={minimized ? "Expand" : "Minimize"}
              onClick={() => setMinimized((v) => !v)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-primary-foreground/90 hover:bg-white/10"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              aria-label="Close support chat"
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/15 text-primary-foreground hover:bg-black/25"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!minimized && (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto bg-secondary/40 px-3 py-3">
                <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Today
                </p>

                {messages.map((m, i) =>
                  m.from === "bot" ? (
                    <div key={i} className="flex items-end gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-card">
                        <img src={logo} alt="" className="h-full w-full object-cover" />
                      </span>
                      <div className="max-w-[78%]">
                        <div className="rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm text-card-foreground shadow-[var(--shadow-card)]">
                          {m.text}
                          {m.orderId && (
                            <Link
                              to="/track"
                              search={{ order: m.orderId }}
                              className="mt-2 flex items-center justify-center gap-1.5 rounded-full gradient-maroon py-2 text-xs font-semibold text-primary-foreground"
                            >
                              <Truck className="h-3.5 w-3.5" /> Track Order
                            </Link>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{m.time}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex flex-col items-end">
                      <p className="mb-0.5 text-[10px] text-muted-foreground">{m.time}</p>
                      <div className="flex max-w-[78%] items-end gap-1 rounded-2xl rounded-br-sm gradient-maroon px-3 py-2 text-sm text-primary-foreground">
                        <span>{m.text}</span>
                        <CheckCheck className="mb-0.5 h-3.5 w-3.5 shrink-0 text-primary-foreground/80" />
                      </div>
                    </div>
                  ),
                )}

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {quickReplies.map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => send(label)}
                      className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-left text-[11px] font-semibold text-primary hover:bg-accent"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-center gap-2 border-t border-border bg-card px-3 py-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={awaitingOrderId ? "Enter your order number…" : "Type a message…"}
                  className="min-w-0 flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full gradient-maroon text-primary-foreground"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

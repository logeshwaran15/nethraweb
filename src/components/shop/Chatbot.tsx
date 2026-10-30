import { Link } from "react-router-dom";
import {
  AlertCircle,
  Bike,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  FileText,
  HelpCircle,
  Home,
  Loader,
  Lock,
  Minus,
  Package,
  Send,
  Truck,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import logo from "@/assets/newlogo.jpeg";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { inr } from "@/lib/mock-data";

/** Customer-care agent: a face wearing a headset with a microphone. `cut` is the colour behind the icon. */
function SupportAgentIcon({
  className = "",
  cut = "#8E1828",
}: {
  className?: string;
  cut?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M5.4 12.2a6.6 6.6 0 0 1 13.2 0"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <rect x="3.1" y="11" width="3.2" height="5.4" rx="1.6" fill="#fff" />
      <rect x="17.7" y="11" width="3.2" height="5.4" rx="1.6" fill="#fff" />
      <ellipse cx="12" cy="13.2" rx="4.7" ry="5.5" fill="#fff" />
      <path
        d="M7.5 12.2c1.6-.2 3.4-1 4.5-2.6 1.1 1.6 2.9 2.4 4.5 2.6"
        stroke={cut}
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <ellipse cx="10.1" cy="13.2" rx="0.62" ry="0.78" fill={cut} />
      <ellipse cx="13.9" cy="13.2" rx="0.62" ry="0.78" fill={cut} />
      <path
        d="M9.4 12.1c.2-.3.6-.4.9-.4M14.6 12.1c-.2-.3-.6-.4-.9-.4"
        stroke={cut}
        strokeWidth="0.55"
        strokeLinecap="round"
      />
      <path
        d="M12 13.6c-.25.55-.3.95.15 1.15"
        stroke={cut}
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      <path
        d="M10.2 16.1c.5.7 1.1 1 1.8 1s1.3-.3 1.8-1"
        stroke={cut}
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      <path
        d="M18.9 15.6c0 2.4-1.9 3.7-4.4 3.7"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="11.4" y="18.2" width="3.8" height="2.2" rx="1.1" fill="#fff" />
    </svg>
  );
}

const TRACK = "Track My Order";
const FAQS = "FAQs";

const actionCards: { label: string; desc: string; icon: LucideIcon }[] = [
  { label: TRACK, desc: "Check your order status and delivery details", icon: Package },
  { label: FAQS, desc: "Get answers to common questions", icon: HelpCircle },
];

// FAQ answers live here so they're easy to edit in one place.
const faqItems: { question: string; answer: string }[] = [
  {
    question: "How can I track my order?",
    answer:
      "You can track your order by selecting “Track My Order” and entering your order number.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery usually takes 3-5 days and express delivery 1-2 days after your order is shipped.",
  },
  {
    question: "Is Cash on Delivery available?",
    answer:
      "No — we currently accept online payments only, securely through Razorpay (UPI, cards, net banking and wallets).",
  },
];

type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";

type OrderRow = {
  Orderkey: string;
  OrderNumber: string;
  Status: OrderStatus;
  Total: string | number;
  CourierName: string | null;
  TrackingId: string | null;
  PaymentStatus?: string;
  CreatedOn?: string;
};
type ItemRow = { ProductName: string; ProductImagePath: string | null; Qty: string | number };
type TrackEvent = { Status: string; CreatedOn: string };
type OrderData = { order: OrderRow; items: ItemRow[]; events: TrackEvent[] };

type OrderChip = {
  key: string;
  number: string;
  status: OrderStatus;
  total: number;
  createdOn?: string | undefined;
  image: string | null;
};

type Msg = {
  id: number;
  from: "bot" | "user";
  kind: "text" | "loading" | "order" | "faq" | "error" | "welcome" | "recent";
  text: string;
  time: string;
  data?: OrderData;
  chips?: OrderChip[];
  retry?: { type: "lookup"; number: string } | { type: "prompt" };
};

let nextId = 1;
const now = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const ORDER_NUMBER = /^NS\d{6,}$/;

const fmtDate = (v?: string) =>
  v
    ? new Date(v.replace(" ", "T")).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
const fmtDateTime = (v?: string) =>
  v
    ? new Date(v.replace(" ", "T")).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const statusBadge: Record<OrderStatus, string> = {
  Processing: "bg-[#FDECCF] text-[#B25E09]",
  Shipped: "bg-[#DCEBFB] text-[#2F6FD0]",
  Delivered: "bg-[#DDF3E6] text-[#1E7A4A]",
  Cancelled: "bg-[#FDE2E0] text-[#C0291D]",
};

// ---------------------------------------------------------------
// Timeline — built only from the order's real status, creation date and recorded status changes.
// ---------------------------------------------------------------
type StepState = "done" | "current" | "pending" | "cancelled";
type Step = { label: string; icon: LucideIcon; state: StepState; note: string; date?: string };

function buildSteps({ order, events }: OrderData): Step[] {
  const when = (status: string) =>
    fmtDateTime(events.filter((e) => e.Status === status).at(-1)?.CreatedOn);

  if (order.Status === "Cancelled") {
    return [
      {
        label: "Order Placed",
        icon: ClipboardList,
        state: "done",
        note: "Your order was placed successfully.",
        date: fmtDateTime(order.CreatedOn),
      },
      {
        label: "Order Confirmed",
        icon: CheckCircle2,
        state: "done",
        note: "Your order was confirmed.",
      },
      {
        label: "Cancelled",
        icon: X,
        state: "cancelled",
        note: "This order was cancelled.",
        date: when("Cancelled"),
      },
    ];
  }

  const at = { Processing: 2, Shipped: 3, Delivered: 5 }[order.Status];
  const stateOf = (i: number): StepState =>
    i < at || order.Status === "Delivered" ? "done" : i === at ? "current" : "pending";
  const courier =
    order.CourierName || order.TrackingId
      ? `Handed over to ${order.CourierName ?? "our courier partner"}.`
      : "Your package has been handed to the courier.";

  const base: Omit<Step, "state">[] = [
    {
      label: "Order Placed",
      icon: ClipboardList,
      note: "Your order has been placed successfully.",
      date: fmtDateTime(order.CreatedOn),
    },
    {
      label: "Order Confirmed",
      icon: CheckCircle2,
      note:
        order.PaymentStatus === "Paid"
          ? "Payment received. We have confirmed your order."
          : "We have confirmed your order.",
    },
    { label: "Processing", icon: Loader, note: "Your order is being prepared." },
    {
      label: "Shipped",
      icon: Truck,
      note: at >= 3 ? courier : "We'll update this once your package is shipped.",
      date: at >= 3 ? when("Shipped") : "",
    },
    {
      label: "Out for Delivery",
      icon: Bike,
      note:
        order.Status === "Delivered"
          ? "Your package reached you."
          : "We'll update this when it's out for delivery.",
    },
    {
      label: "Delivered",
      icon: Home,
      note: order.Status === "Delivered" ? "Your order has been delivered." : "Awaiting delivery.",
      date: order.Status === "Delivered" ? when("Delivered") : "",
    },
  ];
  return base.map((s, i) => ({ ...s, state: stateOf(i) }));
}

function Timeline({ data }: { data: OrderData }) {
  const steps = buildSteps(data);
  return (
    <ol className="mt-4">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const Icon = s.icon;
        return (
          <li key={s.label} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${
                  s.state === "done"
                    ? "border-[#2E9B61] bg-[#2E9B61] text-white"
                    : s.state === "current"
                      ? "border-[#8E1828] bg-[#8E1828] text-white ring-4 ring-[#8E1828]/15 motion-safe:animate-pulse"
                      : s.state === "cancelled"
                        ? "border-[#D92D20] bg-[#D92D20] text-white"
                        : "border-[#E4D6D6] bg-white text-[#B9A7A7]"
                }`}
              >
                {s.state === "done" && i < 2 ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              {!last && (
                <span
                  className={`w-[3px] flex-1 rounded-full ${
                    s.state === "done" ? "bg-[#2E9B61]" : "bg-[#EADCDC]"
                  }`}
                />
              )}
            </div>
            <div className={last ? "min-w-0" : "min-w-0 pb-4"}>
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-[13px] font-semibold leading-5 ${
                    s.state === "pending"
                      ? "text-[#806F6F]"
                      : s.state === "cancelled"
                        ? "text-[#C0291D]"
                        : "text-[#332727]"
                  }`}
                >
                  {s.label}
                </p>
                {s.state === "done" && (
                  <span className="shrink-0 rounded-full bg-[#DDF3E6] px-2 py-0.5 text-[10px] font-semibold text-[#1E7A4A]">
                    Completed
                  </span>
                )}
                {s.state === "current" && (
                  <span className="shrink-0 rounded-full bg-[#FDE2E6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8E1828]">
                    Current
                  </span>
                )}
              </div>
              <p className="text-[11.5px] leading-snug text-[#806F6F]">{s.note}</p>
              {s.date && <p className="mt-0.5 text-[11px] text-[#9A8B8B]">{s.date}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy tracking ID"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#8E1828] hover:bg-[#FFF0F0]"
    >
      {copied ? <Check className="h-4 w-4 text-[#2E9B61]" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function OrderResult({ data }: { data: OrderData }) {
  const { order, items } = data;
  const count = items.reduce((n, i) => n + Number(i.Qty), 0) || items.length;
  const first = items[0];
  return (
    <div className="min-w-0">
      <div className="flex gap-3">
        {first?.ProductImagePath ? (
          <img
            src={first.ProductImagePath}
            alt={first.ProductName}
            className="h-14 w-14 shrink-0 rounded-lg border border-[#E9DADA] object-cover"
          />
        ) : (
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[#FFF0F0] text-[#8E1828]">
            <Package className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="break-all text-sm font-bold text-[#332727]">Order #{order.OrderNumber}</p>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge[order.Status]}`}
            >
              {order.Status}
            </span>
          </div>
          {first && <p className="truncate text-[12.5px] text-[#332727]">{first.ProductName}</p>}
          <p className="text-[12px] text-[#806F6F]">
            {count} item{count === 1 ? "" : "s"} <span className="px-1">|</span>{" "}
            {inr(Number(order.Total))}
            {order.CreatedOn && (
              <>
                <span className="px-1">|</span> {fmtDate(order.CreatedOn)}
              </>
            )}
          </p>
        </div>
      </div>

      <Timeline data={data} />

      {(order.CourierName || order.TrackingId) && (
        <div className="mt-1 flex items-center gap-3 rounded-xl border border-[#E9DADA] bg-[#FFF9F5] p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#8E1828]">
            <Truck className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            {order.CourierName && (
              <p className="truncate text-[13px] font-semibold text-[#332727]">
                {order.CourierName}
              </p>
            )}
            {order.TrackingId && (
              <p className="break-all text-[11.5px] text-[#806F6F]">
                Tracking ID:{" "}
                <span className="font-semibold text-[#332727]">{order.TrackingId}</span>
              </p>
            )}
          </div>
          {order.TrackingId && <CopyButton value={order.TrackingId} />}
        </div>
      )}

      <Link
        to={`/track?order=${order.Orderkey}`}
        className="mt-3 flex h-11 items-center justify-between rounded-xl bg-[#F4EEEE] px-4 text-[13px] font-semibold text-[#332727] transition-colors hover:bg-[#EEE3E3]"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-4 w-4" /> View Order Details
        </span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-3 space-y-2">
      {faqItems.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.question}
            className={`overflow-hidden rounded-xl border ${isOpen ? "border-[#F0D5D5] bg-[#FFF9F5]" : "border-[#E9DADA] bg-white"}`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex min-h-11 w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-[#332727]"
            >
              {f.question}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-[#806F6F] transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="px-3.5 pb-3 text-[12.5px] leading-relaxed text-[#806F6F]">
                  {f.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentOrderCard({ chip, onPick }: { chip: OrderChip; onPick: (c: OrderChip) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(chip)}
      className="flex w-full items-center gap-3 rounded-xl border border-[#E9DADA] bg-white p-2.5 text-left transition-colors hover:bg-[#FFF9F5]"
    >
      {chip.image ? (
        <img src={chip.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#FFF0F0] text-[#8E1828]">
          <Package className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-[#332727]">{chip.number}</p>
        <p className="text-[11.5px] text-[#806F6F]">{fmtDate(chip.createdOn)}</p>
        <p className="text-[12.5px] font-semibold text-[#332727]">{inr(chip.total)}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge[chip.status]}`}
      >
        {chip.status}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-[#806F6F]" />
    </button>
  );
}

export function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [muted, setMuted] = useState(false);
  const [input, setInput] = useState("");
  const [awaitingOrderId, setAwaitingOrderId] = useState(false);
  const [busy, setBusy] = useState(false);
  const firstName = user?.FullName?.trim().split(" ")[0];
  const [messages, setMessages] = useState<Msg[]>([
    { id: nextId++, from: "bot", kind: "welcome", text: "", time: now() },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open, minimized]);

  useEffect(() => {
    if (open && !minimized && awaitingOrderId) inputRef.current?.focus();
  }, [open, minimized, awaitingOrderId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const add = (msg: Omit<Msg, "id" | "time">): number => {
    const id = nextId++;
    setMessages((m) => [...m, { ...msg, id, time: now() }]);
    return id;
  };
  const replace = (id: number, msg: Omit<Msg, "id" | "time">) =>
    setMessages((m) => m.map((x) => (x.id === id ? { ...msg, id, time: now() } : x)));
  const pushBot = (text: string, extra: Partial<Msg> = {}) =>
    add({ from: "bot", kind: "text", text, ...extra });
  const pushUser = (text: string) => add({ from: "user", kind: "text", text });

  // ----- Order lookup -----
  const lookupOrder = async (number: string) => {
    setBusy(true);
    const loadingId = add({ from: "bot", kind: "loading", text: "Checking your order" });
    try {
      const order = await apiGet<OrderRow>(`/api/orders.php?number=${encodeURIComponent(number)}`);
      const [items, events] = await Promise.all([
        apiGet<ItemRow[]>(`/api/order_items.php?orderKey=${order.Orderkey}`).catch(() => []),
        apiGet<TrackEvent[]>(`/api/order_tracking.php?orderKey=${order.Orderkey}`).catch(() => []),
      ]);
      replace(loadingId, { from: "bot", kind: "order", text: "", data: { order, items, events } });
    } catch (err) {
      if (err instanceof Error && err.message === "Order not found") {
        replace(loadingId, {
          from: "bot",
          kind: "error",
          text: "We couldn't find that order\n\nPlease check your order number and try again.",
          retry: { type: "prompt" },
        });
      } else {
        replace(loadingId, {
          from: "bot",
          kind: "error",
          text: "We're having trouble checking your order.\n\nPlease try again in a moment.",
          retry: { type: "lookup", number },
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const startTracking = async () => {
    setAwaitingOrderId(true);
    if (user) {
      try {
        const rows = await apiGet<OrderRow[]>(`/api/orders.php?userKey=${user.Userkey}`);
        if (rows.length > 0) {
          const chips: OrderChip[] = await Promise.all(
            rows.slice(0, 5).map(async (o) => {
              const items = await apiGet<ItemRow[]>(
                `/api/order_items.php?orderKey=${o.Orderkey}`,
              ).catch(() => []);
              return {
                key: o.Orderkey,
                number: o.OrderNumber,
                status: o.Status,
                total: Number(o.Total),
                createdOn: o.CreatedOn,
                image: items[0]?.ProductImagePath ?? null,
              };
            }),
          );
          pushBot("Enter your order number below, or select one of your recent orders.", {
            kind: "recent",
            chips,
          });
          return;
        }
      } catch {
        // fall through to the plain prompt
      }
    }
    pushBot("Sure! Please enter your order number to check the latest status.");
  };

  const handleOrderNumber = (raw: string) => {
    const number = raw.trim().toUpperCase();
    if (!ORDER_NUMBER.test(number)) {
      pushBot(
        "That doesn't look like a valid order number. It starts with NS followed by digits, e.g. NS1234567890.",
      );
      return;
    }
    setAwaitingOrderId(false);
    void lookupOrder(number);
  };

  const showFaqs = () =>
    add({ from: "bot", kind: "faq", text: "Here are some frequently asked questions." });

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    pushUser(value);
    setInput("");

    if (value === TRACK) {
      setTimeout(() => void startTracking(), 250);
      return;
    }
    if (value === FAQS) {
      setTimeout(showFaqs, 250);
      return;
    }
    if (awaitingOrderId || ORDER_NUMBER.test(value.toUpperCase())) {
      setTimeout(() => handleOrderNumber(value), 250);
      return;
    }
    setTimeout(
      () =>
        pushBot(
          "I can help you track an order or answer common questions. Please choose “Track My Order” or “FAQs”.",
        ),
      250,
    );
  };

  const pickOrder = (chip: OrderChip) => {
    if (busy) return;
    pushUser(chip.number);
    setAwaitingOrderId(false);
    void lookupOrder(chip.number);
  };

  const retry = (m: Msg) => {
    if (!m.retry || busy) return;
    setMessages((list) => list.filter((x) => x.id !== m.id));
    if (m.retry.type === "lookup") void lookupOrder(m.retry.number);
    else {
      setAwaitingOrderId(true);
      pushBot("Please enter your order number.");
    }
  };

  // Very faint mehandi-style floral tile behind the conversation.
  const pattern =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cg fill='none' stroke='%238E1828' stroke-opacity='0.05' stroke-width='1.2'%3E%3Ccircle cx='30' cy='30' r='5'/%3E%3Cpath d='M30 15c4 6 4 9 0 15-4-6-4-9 0-15zM30 45c4-6 4-9 0-15-4 6-4 9 0 15zM15 30c6 4 9 4 15 0-6-4-9-4-15 0zM45 30c-6-4-9-4-15 0 6 4 9 4 15 0z'/%3E%3Ccircle cx='90' cy='90' r='5'/%3E%3Cpath d='M90 75c4 6 4 9 0 15-4-6-4-9 0-15zM90 105c4-6 4-9 0-15-4 6-4 9 0 15zM75 90c6 4 9 4 15 0-6-4-9-4-15 0zM105 90c-6-4-9-4-15 0 6 4 9 4 15 0z'/%3E%3C/g%3E%3C/svg%3E\")";

  return (
    <>
      <div className="fixed bottom-24 right-4 z-40 md:bottom-6 md:right-6">
        {!open && (
          <span className="absolute inset-0 -z-10 rounded-full bg-[#8E1828]/35 motion-safe:animate-ping [animation-duration:3s]" />
        )}
        <button
          aria-label={open ? "Close customer support" : "Open customer support"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="group grid h-16 w-16 place-items-center rounded-full border-2 border-[#D5A64A]/60 bg-[#8E1828] text-white shadow-[0_8px_28px_rgba(142,24,40,0.45)] transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E1828] active:scale-95"
        >
          {open ? <X className="h-7 w-7" /> : <SupportAgentIcon className="h-9 w-9" />}
        </button>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#D5A64A] text-[10px] font-bold text-[#332727]">
            1
          </span>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Nethra's customer support"
          className={`fixed z-50 flex flex-col overflow-hidden bg-white shadow-[0_16px_48px_rgba(51,39,39,0.28)] animate-in fade-in slide-in-from-bottom-4 duration-300 inset-x-0 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[420px] sm:rounded-[20px] sm:border sm:border-[#E9DADA] ${
            minimized
              ? "bottom-0 sm:bottom-24"
              : "inset-y-0 h-[100dvh] sm:inset-y-auto sm:h-[680px] sm:max-h-[calc(100dvh-8rem)]"
          }`}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 bg-[#8E1828] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#FFE4E8] shadow-[0_0_0_2px_#D5A64A]">
              <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-xl font-semibold leading-tight text-white">
                Nethra&apos;s Assistant
              </p>
              <p className="text-xs text-white/85">Customer Support</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/90">
                <span className="h-2 w-2 rounded-full bg-[#3DD17A] ring-2 ring-[#3DD17A]/30" />
                Online • Usually replies instantly
              </p>
            </div>
            <button
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted((v) => !v)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              {muted ? (
                <VolumeX className="h-[18px] w-[18px]" />
              ) : (
                <Volume2 className="h-[18px] w-[18px]" />
              )}
            </button>
            <button
              aria-label={minimized ? "Expand" : "Minimize"}
              onClick={() => setMinimized((v) => !v)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <Minus className="h-[18px] w-[18px]" />
            </button>
            <button
              aria-label="Close customer support"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          {!minimized && (
            <>
              <div
                className="flex-1 space-y-4 overflow-y-auto bg-[#FFFBF8] px-3 py-4 sm:px-4"
                style={{ backgroundImage: pattern }}
              >
                {messages.map((m) =>
                  m.from === "bot" ? (
                    <div key={m.id} className="space-y-3">
                      <div className="flex items-end gap-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#8E1828]">
                          <SupportAgentIcon className="h-7 w-7" />
                        </span>
                        <div
                          className={
                            m.kind === "order" || m.kind === "faq" || m.kind === "recent"
                              ? "min-w-0 flex-1"
                              : "max-w-[84%]"
                          }
                        >
                          <div className="min-w-0 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 text-sm leading-relaxed text-[#332727] shadow-[0_1px_5px_rgba(51,39,39,0.1)]">
                            {m.kind === "welcome" && (
                              <>
                                <p>
                                  Hi{firstName ? ` ${firstName}` : ""}! <span aria-hidden>👋</span>
                                </p>
                                <p className="mt-1 font-semibold">
                                  I&apos;m Nethra&apos;s Assistant.
                                </p>
                                <p>How can I help you today?</p>
                              </>
                            )}

                            {m.kind === "loading" && (
                              <span className="flex items-center gap-2">
                                {m.text}
                                <span className="flex gap-1" aria-label="Loading">
                                  {[0, 150, 300].map((d) => (
                                    <span
                                      key={d}
                                      className="h-1.5 w-1.5 rounded-full bg-[#8E1828] motion-safe:animate-bounce"
                                      style={{ animationDelay: `${d}ms` }}
                                    />
                                  ))}
                                </span>
                              </span>
                            )}

                            {m.kind === "order" && m.data && <OrderResult data={m.data} />}

                            {(m.kind === "text" || m.kind === "recent") && (
                              <span className="whitespace-pre-line">{m.text}</span>
                            )}

                            {m.kind === "recent" && m.chips && (
                              <div className="mt-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#332727]">
                                    <Clock className="h-4 w-4 text-[#8E1828]" /> Recent Orders
                                  </p>
                                  <Link
                                    to="/orders"
                                    className="text-xs font-semibold text-[#2F6FD0] hover:underline"
                                  >
                                    View All
                                  </Link>
                                </div>
                                <div className="space-y-2">
                                  {m.chips.map((c) => (
                                    <RecentOrderCard key={c.key} chip={c} onPick={pickOrder} />
                                  ))}
                                </div>
                              </div>
                            )}

                            {m.kind === "faq" && (
                              <>
                                <p className="flex items-center gap-1.5 text-[15px] font-bold text-[#8E1828]">
                                  <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
                                </p>
                                <FaqAccordion />
                              </>
                            )}

                            {m.kind === "error" && (
                              <>
                                <span className="flex gap-2">
                                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#C0291D]" />
                                  <span className="whitespace-pre-line">{m.text}</span>
                                </span>
                                {m.retry && (
                                  <button
                                    onClick={() => retry(m)}
                                    className="mt-3 h-10 w-full rounded-xl border border-[#8E1828] text-xs font-semibold text-[#8E1828] hover:bg-[#FFF0F0]"
                                  >
                                    Try Again
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                          {m.kind !== "loading" && (
                            <p className="mt-1 text-[10px] text-[#806F6F]">{m.time}</p>
                          )}
                        </div>
                      </div>

                      {m.kind === "welcome" && (
                        <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
                          {actionCards.map(({ label, desc, icon: Icon }) => (
                            <button
                              key={label}
                              onClick={() => send(label)}
                              disabled={busy}
                              className="group flex flex-col rounded-2xl border border-[#F0DADA] bg-[#FFF3F3] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(142,24,40,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] disabled:opacity-60"
                            >
                              <span className="flex items-start justify-between">
                                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FBE3E5] text-[#8E1828]">
                                  <Icon className="h-5 w-5" />
                                </span>
                                <ChevronRight className="h-4 w-4 text-[#8E1828] transition-transform group-hover:translate-x-0.5" />
                              </span>
                              <span className="mt-3 text-sm font-bold text-[#332727]">{label}</span>
                              <span className="mt-0.5 text-[11.5px] leading-snug text-[#806F6F]">
                                {desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div key={m.id} className="flex flex-col items-end">
                      <div className="max-w-[84%] break-words rounded-2xl rounded-br-md bg-[#8E1828] px-3.5 py-2.5 text-sm leading-relaxed text-white">
                        {m.text}
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-[#806F6F]">
                        {m.time} <CheckCheck className="h-3.5 w-3.5 text-[#2F6FD0]" />
                      </p>
                    </div>
                  ),
                )}

                {messages.length > 1 && (
                  <div className="grid grid-cols-2 gap-2">
                    {actionCards.map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        onClick={() => send(label)}
                        disabled={busy}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E9DADA] bg-white px-3 text-xs font-semibold text-[#8E1828] transition-colors hover:bg-[#FFF0F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] disabled:opacity-60"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="shrink-0 border-t border-[#E9DADA] bg-white px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    aria-label="Type your message"
                    placeholder={
                      awaitingOrderId
                        ? "Enter order number e.g. NS1234567890"
                        : "Type your message..."
                    }
                    className="h-[52px] min-w-0 flex-1 rounded-full border border-[#E9DADA] bg-[#FFF9F5] px-5 text-sm text-[#332727] outline-none placeholder:text-[#806F6F] focus:border-[#8E1828] focus:ring-2 focus:ring-[#8E1828]/20"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    aria-label="Send message"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#8E1828] text-white transition-colors hover:bg-[#741421] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E1828] disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-[10.5px] text-[#806F6F]">
                  <Lock className="h-3 w-3" /> Powered by Nethra&apos;s • Secure &amp; Private
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

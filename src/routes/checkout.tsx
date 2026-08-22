import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { inr } from "@/lib/mock-data";
import { Screen } from "@/components/shop/AppChrome";
import { useShop } from "@/lib/shop-store";
import { useAuth } from "@/lib/auth-store";
import { showToast } from "@/lib/toast";
import { fetchAddresses, saveAddress, deleteAddress, type Address } from "@/lib/address";
import {
  calcDeliveryQuote,
  fetchDefaultShipping,
  fetchDeliveryZones,
  EXPRESS_DAYS,
  EXPRESS_SURCHARGE,
  type DeliveryZoneRule,
} from "@/lib/delivery";

export default function CheckoutPage() {
  const { cart, subtotal, discount, shippingInfo, setShippingInfo, setShippingFee } = useShop();
  const { user } = useAuth();
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [zones, setZones] = useState<DeliveryZoneRule[]>([]);
  const [fallback, setFallback] = useState({ freeAbove: 999, flatFee: 49 });

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [saveThisAddress, setSaveThisAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState("Home");

  useEffect(() => {
    fetchDeliveryZones().then(setZones).catch(() => setZones([]));
    fetchDefaultShipping().then(setFallback).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAddresses(user.Userkey)
      .then((list) => {
        setSavedAddresses(list);
        if (list.length > 0) {
          selectAddress(list.find((a) => a.isDefault) ?? list[0]!);
          setShowForm(false);
        }
      })
      .catch(() => setSavedAddresses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectAddress = (a: Address) => {
    setSelectedId(a.id);
    setShowForm(false);
    setShippingInfo({
      ...shippingInfo,
      fullName: a.fullName,
      phone: a.phone,
      address: a.addressLine,
      landmark: a.landmark,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    });
  };

  const startNewAddress = () => {
    setSelectedId(null);
    setShowForm(true);
    setShippingInfo({
      ...shippingInfo,
      fullName: "",
      address: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  const removeAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      setSavedAddresses((list) => list.filter((a) => a.id !== id));
      if (selectedId === id) startNewAddress();
      showToast("Address removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove address", "error");
    }
  };

  const net = subtotal - discount;
  const quote = useMemo(
    () => calcDeliveryQuote(zones, shippingInfo.pincode, net, fallback),
    [zones, shippingInfo.pincode, net, fallback],
  );
  const fee = method === "standard" ? quote.standardFee : quote.expressFee;

  useEffect(() => {
    setShippingFee(fee);
  }, [fee, setShippingFee]);

  // Persist a new address once the shipping form is filled in, if the user opted to save it.
  useEffect(() => {
    if (!user || !showForm || !saveThisAddress) return;
    const ready =
      shippingInfo.fullName && shippingInfo.phone && shippingInfo.address && shippingInfo.pincode.length >= 6;
    if (!ready) return;
    const timeout = setTimeout(() => {
      saveAddress(user.Userkey, {
        label: addressLabel,
        fullName: shippingInfo.fullName,
        phone: shippingInfo.phone,
        addressLine: shippingInfo.address,
        landmark: shippingInfo.landmark,
        city: shippingInfo.city,
        state: shippingInfo.state,
        pincode: shippingInfo.pincode,
        isDefault: savedAddresses.length === 0,
      })
        .then((saved) => {
          setSavedAddresses((list) => [saved, ...list]);
          setSelectedId(saved.id);
          showToast("Address saved for next time", "success");
        })
        .catch(() => {});
    }, 1200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user,
    showForm,
    saveThisAddress,
    addressLabel,
    shippingInfo.fullName,
    shippingInfo.phone,
    shippingInfo.address,
    shippingInfo.pincode,
  ]);

  const field = (key: keyof typeof shippingInfo) => ({
    value: shippingInfo[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setShippingInfo({ ...shippingInfo, [key]: e.target.value }),
  });

  const pincodeReady = shippingInfo.pincode.trim().length >= 3;

  return (
    <Screen title="Checkout" back>
      <div className="space-y-5 p-4">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-primary">Shipping Information</h3>
            {user && savedAddresses.length > 0 && !showForm && (
              <button
                onClick={startNewAddress}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Address
              </button>
            )}
          </div>

          {user && savedAddresses.length > 0 && !showForm && (
            <div className="mt-3 space-y-2">
              {savedAddresses.map((a) => (
                <div
                  key={a.id}
                  onClick={() => selectAddress(a)}
                  className={`flex cursor-pointer items-start justify-between gap-2 rounded-xl border px-3 py-3 ${
                    selectedId === a.id ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{a.label}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold">
                      {a.fullName} · {a.phone}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {a.addressLine}
                      {a.landmark ? `, ${a.landmark}` : ""}, {a.city}, {a.state} - {a.pincode}
                    </p>
                  </div>
                  <button
                    aria-label={`Delete ${a.label} address`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAddress(a.id);
                    }}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {(showForm || !user || savedAddresses.length === 0) && (
            <div className="mt-3 space-y-3">
              {user && (
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setAddressLabel(l)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        addressLabel === l
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <Field label="Full Name" placeholder="Enter your full name" {...field("fullName")} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mobile Number" placeholder="+91 98765 43210" {...field("phone")} />
                <Field label="Email (optional)" placeholder="you@example.com" {...field("email")} />
              </div>
              <Field label="Address" placeholder="House no., Street, Area" {...field("address")} />
              <Field label="Landmark (optional)" placeholder="Nearby landmark" {...field("landmark")} />
              <div className="grid grid-cols-3 gap-3">
                <Field label="City" placeholder="Chennai" {...field("city")} />
                <Field label="State" placeholder="Tamil Nadu" {...field("state")} />
                <Field label="Pincode" placeholder="600001" {...field("pincode")} />
              </div>

              {user ? (
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={saveThisAddress}
                    onChange={(e) => setSaveThisAddress(e.target.checked)}
                  />
                  Save this address for next time
                </label>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  <Link to="/account" className="font-semibold text-primary">
                    Log in
                  </Link>{" "}
                  to save this address and reuse it on your next order.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-display text-lg font-semibold text-primary">Delivery Method</h3>

          {!pincodeReady ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> Enter your pincode above to calculate delivery
              charges.
            </p>
          ) : (
            <>
              {quote.zoneName && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Delivering to <span className="font-semibold text-primary">{quote.zoneName}</span>
                </p>
              )}
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => setMethod("standard")}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left ${
                    method === "standard" ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">Standard Delivery</span>
                    <span className="block text-[11px] text-muted-foreground">{quote.estimatedDays}</span>
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {quote.standardFee ? inr(quote.standardFee) : "Free"}
                  </span>
                </button>
                <button
                  onClick={() => setMethod("express")}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left ${
                    method === "express" ? "border-primary bg-accent" : "border-border"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">Express Delivery</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {EXPRESS_DAYS} · +{inr(EXPRESS_SURCHARGE)} surcharge
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-primary">{inr(quote.expressFee)}</span>
                </button>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-display text-lg font-semibold text-primary">Order Summary</h3>
          <div className="mt-3 space-y-2">
            {cart.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-11 w-11 rounded-lg object-cover"
                />
                <p className="min-w-0 flex-1 truncate text-[13px]">
                  {product.name} <span className="text-muted-foreground">× {qty}</span>
                </p>
                <span className="text-sm font-semibold">{inr(product.price * qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{inr(subtotal + discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-success">-{inr(discount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{pincodeReady ? (fee ? inr(fee) : "Free") : "—"}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-primary">{inr(net + (pincodeReady ? fee : 0))}</span>
            </div>
          </div>
        </section>

        <Link
          to="/payment"
          className="block rounded-full gradient-maroon py-3.5 text-center text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
        >
          Continue to Payment
        </Link>
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" /> 100% secure checkout · Your details are safe
        </p>
      </div>
    </Screen>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

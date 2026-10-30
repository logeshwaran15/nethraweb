import { lineKey } from "@/lib/catalog";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  LogIn,
  MapPin,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { inr } from "@/lib/mock-data";
import { Screen } from "@/components/shop/AppChrome";
import { useShop } from "@/lib/shop-store";
import { useAuth } from "@/lib/auth-store";
import { showToast } from "@/lib/toast";
import {
  fetchAddresses,
  saveAddress,
  updateAddress,
  deleteAddress,
  type Address,
} from "@/lib/address";
import {
  calcDeliveryQuote,
  fetchDefaultShipping,
  fetchDeliveryZones,
  type DeliveryZoneRule,
} from "@/lib/delivery";

export default function CheckoutPage() {
  const {
    cart,
    subtotal,
    discount,
    couponCode,
    couponDiscount,
    shippingInfo,
    setShippingInfo,
    setShippingFee,
  } = useShop();
  const { user } = useAuth();
  const [method] = useState<"standard" | "express">("standard");
  const [zones, setZones] = useState<DeliveryZoneRule[]>([]);
  const [fallback, setFallback] = useState({ freeAbove: 999, flatFee: 49 });

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [saveThisAddress, setSaveThisAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(Boolean(user));

  useEffect(() => {
    fetchDeliveryZones()
      .then(setZones)
      .catch(() => setZones([]));
    fetchDefaultShipping()
      .then(setFallback)
      .catch(() => {});
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
      .catch(() => setSavedAddresses([]))
      .finally(() => setLoadingAddresses(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectAddress = (a: Address) => {
    setSelectedId(a.id);
    setEditingId(null);
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
    setEditingId(null);
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

  const startEditAddress = (a: Address) => {
    setSelectedId(a.id);
    setEditingId(a.id);
    setAddressLabel(a.label);
    setShowForm(true);
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

  const net = subtotal - couponDiscount;
  const quote = useMemo(
    () => calcDeliveryQuote(zones, shippingInfo.pincode, net, fallback),
    [zones, shippingInfo.pincode, net, fallback],
  );
  const fee = method === "standard" ? quote.standardFee : quote.expressFee;

  useEffect(() => {
    setShippingFee(fee);
  }, [fee, setShippingFee]);

  // Persist the address once the shipping form is filled in, if the user opted to save it.
  // Updates the existing row when editing a saved address, otherwise creates a new one.
  useEffect(() => {
    if (!user || !showForm || !saveThisAddress) return;
    const ready =
      shippingInfo.fullName &&
      shippingInfo.phone &&
      shippingInfo.address &&
      shippingInfo.pincode.length >= 6;
    if (!ready) return;
    const timeout = setTimeout(() => {
      const payload = {
        label: addressLabel,
        fullName: shippingInfo.fullName,
        phone: shippingInfo.phone,
        addressLine: shippingInfo.address,
        landmark: shippingInfo.landmark,
        city: shippingInfo.city,
        state: shippingInfo.state,
        pincode: shippingInfo.pincode,
        isDefault: editingId
          ? (savedAddresses.find((a) => a.id === editingId)?.isDefault ?? false)
          : savedAddresses.length === 0,
      };
      const request = editingId
        ? updateAddress(editingId, payload)
        : saveAddress(user.Userkey, payload);
      request
        .then((saved) => {
          setSavedAddresses((list) =>
            editingId ? list.map((a) => (a.id === saved.id ? saved : a)) : [saved, ...list],
          );
          setSelectedId(saved.id);
          setEditingId(saved.id);
          showToast(editingId ? "Address updated" : "Address saved for next time", "success");
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

  // Digits-only fields: phone keeps the last 10 digits (drops a +91 prefix), pincode is 6 digits.
  const digitsOnly = (key: keyof typeof shippingInfo, max: number) => {
    const clean = (v: string) => {
      const d = v.replace(/[^0-9]/g, "");
      return key === "phone" && d.length > max ? d.slice(-max) : d.slice(0, max);
    };
    return {
      value: clean(shippingInfo[key]),
      inputMode: "numeric" as const,
      maxLength: key === "phone" ? 15 : max,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setShippingInfo({ ...shippingInfo, [key]: clean(e.target.value) }),
    };
  };

  const field = (key: keyof typeof shippingInfo) => ({
    value: shippingInfo[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setShippingInfo({ ...shippingInfo, [key]: e.target.value }),
  });

  const pincodeReady = shippingInfo.pincode.trim().length >= 3;
  const itemCount = cart.reduce((n, c) => n + c.qty, 0);
  const cardCls =
    "rounded-xl border border-[#E9DADA] bg-white p-5 shadow-[0_1px_8px_rgba(45,37,37,0.04)] md:p-6";
  const showAddressForm = showForm || !user || savedAddresses.length === 0;

  return (
    <Screen title="Checkout" back>
      <div className="bg-[#FFF9F5] px-4 pb-10 pt-5 md:px-8 md:pt-8">
        <div className="mx-auto max-w-[1240px]">
          {/* Progress */}
          <ol
            className="mb-6 flex items-center gap-2 text-xs font-semibold sm:gap-3"
            aria-label="Checkout progress"
          >
            {[
              { n: 1, label: "Shipping", active: true },
              { n: 2, label: "Payment", active: false },
              { n: 3, label: "Review & Place Order", active: false },
            ].map((s, i) => (
              <li
                key={s.n}
                className="flex items-center gap-2 sm:gap-3"
                aria-current={s.active ? "step" : undefined}
              >
                {i > 0 && <span className="h-px w-5 bg-[#E9DADA] sm:w-14" />}
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                    s.active ? "bg-[#8E1828] text-white" : "bg-[#EFE6E6] text-[#786B6B]"
                  }`}
                >
                  {s.n}
                </span>
                <span className={s.active ? "text-[#8E1828]" : "hidden text-[#786B6B] sm:inline"}>
                  {s.label}
                </span>
              </li>
            ))}
          </ol>

          {!user && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#C9A34A]/40 bg-[#C9A34A]/10 px-4 py-3.5">
              <div>
                <p className="text-sm font-semibold text-[#2D2525]">Sign in to place your order</p>
                <p className="text-xs text-[#786B6B]">
                  Save your address and track your orders easily.
                </p>
              </div>
              <Link
                to="/account"
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#8E1828] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#741421]"
              >
                <LogIn className="h-3.5 w-3.5" /> Login
              </Link>
            </div>
          )}

          <div className="md:grid md:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] md:items-start md:gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Shipping information */}
              <section className={cardCls}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-[#2D2525]">
                      <MapPin className="h-5 w-5 text-[#8E1828]" /> Shipping Information
                    </h2>
                    <p className="mt-0.5 text-xs text-[#786B6B]">Enter your delivery details</p>
                  </div>
                  {user && savedAddresses.length > 0 && !showForm && (
                    <button
                      onClick={startNewAddress}
                      className="flex min-h-10 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold text-[#8E1828] hover:bg-[#FFF0F0]"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add New Address
                    </button>
                  )}
                </div>

                {user && loadingAddresses && (
                  <div className="mt-4 space-y-2" aria-busy="true">
                    {[0, 1].map((i) => (
                      <div key={i} className="h-[76px] animate-pulse rounded-xl bg-[#F5EDED]" />
                    ))}
                  </div>
                )}

                {user && !loadingAddresses && savedAddresses.length === 0 && !showForm && (
                  <div className="mt-4 rounded-xl bg-[#FFF7F7] px-4 py-5 text-center">
                    <p className="text-sm text-[#786B6B]">No saved addresses yet.</p>
                    <button
                      onClick={startNewAddress}
                      className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-[#8E1828]"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add New Address
                    </button>
                  </div>
                )}

                {user && savedAddresses.length > 0 && !showForm && (
                  <div className="mt-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#786B6B]">
                      Saved Addresses
                    </p>
                    <div className="space-y-2.5" role="radiogroup" aria-label="Saved addresses">
                      {savedAddresses.map((a) => {
                        const selected = selectedId === a.id;
                        return (
                          <div
                            key={a.id}
                            role="radio"
                            aria-checked={selected}
                            tabIndex={0}
                            onClick={() => selectAddress(a)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                selectAddress(a);
                              }
                            }}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#8E1828] ${
                              selected
                                ? "border-[#8E1828] bg-[#FFF0F0]"
                                : "border-[#E9DADA] bg-white hover:border-[#8E1828]/40"
                            }`}
                          >
                            <span
                              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                                selected ? "border-[#8E1828]" : "border-[#CFC5C5]"
                              }`}
                            >
                              {selected && (
                                <span className="h-2.5 w-2.5 rounded-full bg-[#8E1828]" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#8E1828]">
                                {a.label}
                              </p>
                              <p className="mt-0.5 text-sm font-semibold text-[#2D2525]">
                                {a.fullName} · {a.phone}
                              </p>
                              <p className="mt-0.5 text-xs leading-relaxed text-[#786B6B]">
                                {a.addressLine}
                                {a.landmark ? `, ${a.landmark}` : ""}, {a.city}, {a.state} -{" "}
                                {a.pincode}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center">
                              <button
                                aria-label={`Edit ${a.label} address`}
                                title="Edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditAddress(a);
                                }}
                                className="grid h-10 w-10 place-items-center rounded-md text-[#786B6B] transition-colors hover:bg-white hover:text-[#8E1828]"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                aria-label={`Delete ${a.label} address`}
                                title="Delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAddress(a.id);
                                }}
                                className="grid h-10 w-10 place-items-center rounded-md text-[#786B6B] transition-colors hover:bg-white hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {showAddressForm && !(user && loadingAddresses) && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    {user && savedAddresses.length > 0 && (
                      <div className="flex items-center justify-between border-b border-dashed border-[#CFC5C5] pb-3">
                        <p className="text-sm font-semibold text-[#8E1828]">
                          {editingId ? "Editing address" : "New address"}
                        </p>
                        <button
                          onClick={() =>
                            selectAddress(
                              savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0]!,
                            )
                          }
                          className="min-h-10 px-2 text-xs font-semibold text-[#786B6B] hover:text-[#8E1828] hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {user && (
                      <div className="flex gap-2" role="group" aria-label="Address label">
                        {["Home", "Work", "Other"].map((l) => (
                          <button
                            key={l}
                            onClick={() => setAddressLabel(l)}
                            aria-pressed={addressLabel === l}
                            className={`h-9 rounded-lg border px-4 text-xs font-semibold transition-colors ${
                              addressLabel === l
                                ? "border-[#8E1828] bg-[#8E1828] text-white"
                                : "border-[#E9DADA] bg-white text-[#786B6B] hover:border-[#8E1828]/40"
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    )}
                    <Field
                      label="Full Name"
                      required
                      placeholder="Enter your full name"
                      {...field("fullName")}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Mobile Number"
                        required
                        placeholder="98765 43210"
                        {...digitsOnly("phone", 10)}
                      />
                      <Field
                        label="Email (optional)"
                        placeholder="you@example.com"
                        {...field("email")}
                      />
                    </div>
                    <Field
                      label="Address"
                      required
                      placeholder="House no., Street, Area"
                      {...field("address")}
                    />
                    <Field
                      label="Landmark (optional)"
                      placeholder="Nearby landmark"
                      {...field("landmark")}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="City" required placeholder="Chennai" {...field("city")} />
                      <Field label="State" required placeholder="Tamil Nadu" {...field("state")} />
                      <Field
                        label="Pincode"
                        required
                        placeholder="600001"
                        {...digitsOnly("pincode", 6)}
                      />
                    </div>

                    {user ? (
                      <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-[#2D2525]">
                        <input
                          type="checkbox"
                          checked={saveThisAddress}
                          onChange={(e) => setSaveThisAddress(e.target.checked)}
                          className="h-4 w-4 accent-[#8E1828]"
                        />
                        Save this address for next time
                      </label>
                    ) : (
                      <p className="text-xs text-[#786B6B]">
                        <Link to="/account" className="font-semibold text-[#8E1828] underline">
                          Login
                        </Link>{" "}
                        to save this address and reuse it on your next order.
                      </p>
                    )}
                  </div>
                )}
              </section>

            </div>

            {/* Order summary */}
            <aside className="mt-5 md:sticky md:top-6 md:mt-0">
              <div className={cardCls}>
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-[#2D2525]">
                    <ShoppingBag className="h-5 w-5 text-[#8E1828]" /> Order Summary
                  </h2>
                  <span className="text-xs text-[#786B6B]">
                    {itemCount} Item{itemCount === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {cart.map(({ product, qty }) => (
                    <div key={lineKey(product)} className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        width={800}
                        height={800}
                        className="h-14 w-14 shrink-0 rounded-lg bg-[#FFF7F7] object-cover"
                      />
                      <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-[#2D2525]">
                        {product.name} <span className="text-[#786B6B]">× {qty}</span>
                      </p>
                      <span className="text-sm font-semibold text-[#2D2525]">
                        {inr(product.price * qty)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-2.5 border-t border-[#E9DADA] pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#786B6B]">Subtotal</span>
                    <span className="font-semibold">{inr(subtotal + discount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#786B6B]">Discount</span>
                    <span className="font-semibold text-[#2E9B61]">-{inr(discount)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[#786B6B]">Coupon ({couponCode})</span>
                      <span className="font-semibold text-[#2E9B61]">-{inr(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#786B6B]">Shipping</span>
                    <span className="font-semibold">
                      {pincodeReady ? (fee ? inr(fee) : "Free") : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#CFC5C5] pt-4">
                  <span className="text-base font-semibold text-[#2D2525]">Total</span>
                  <span
                    key={net + (pincodeReady ? fee : 0)}
                    className="animate-in fade-in text-[26px] font-bold leading-none text-[#8E1828] duration-300"
                  >
                    {inr(net + (pincodeReady ? fee : 0))}
                  </span>
                </div>

                <Link
                  to={user ? "/payment" : "/account"}
                  aria-disabled={!user}
                  className={`mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E1828] ${
                    user
                      ? "bg-[#8E1828] text-white shadow-[0_4px_14px_rgba(142,24,40,0.25)] hover:bg-[#741421]"
                      : "bg-[#EFE6E6] text-[#786B6B]"
                  }`}
                >
                  {!user && <LogIn className="h-4 w-4" />}
                  {user ? (
                    <>
                      Continue to Payment <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    "Sign in to Continue"
                  )}
                </Link>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#786B6B]">
                  <ShieldCheck className="h-3.5 w-3.5" /> 100% secure checkout · Your details are
                  safe
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
  inputMode,
  maxLength,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  inputMode?: "numeric";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#2D2525]">
        {label}
        {required && <span className="ml-0.5 text-[#8E1828]">*</span>}
      </span>
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        className="h-11 w-full rounded-lg border border-[#E9DADA] bg-white px-3 text-sm outline-none transition-shadow focus:border-[#8E1828] focus:ring-4 focus:ring-[#FFF0F0]"
      />
    </label>
  );
}

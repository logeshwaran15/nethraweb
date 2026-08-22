import { useState } from "react";
import { CreditCard, Phone, Save, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/lib/admin-store";
import { uploadImage } from "@/lib/api";
import { showToast } from "@/lib/toast";

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "mb-1 block text-xs font-semibold text-muted-foreground";

const tabs = [
  { key: "seo", label: "SEO", icon: Search },
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "contact", label: "Contact Details", icon: Phone },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AdminSettings() {
  const [tab, setTab] = useState<TabKey>("seo");
  const { seo, setSeo, payment, setPayment, contact, setContact } = useAdmin();

  const [seoDraft, setSeoDraft] = useState(seo);
  const [paymentDraft, setPaymentDraft] = useState(payment);
  const [contactDraft, setContactDraft] = useState(contact);

  const [saved, setSaved] = useState(false);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const save = () => {
    if (tab === "seo") setSeo(seoDraft);
    if (tab === "payment") setPayment(paymentDraft);
    if (tab === "contact") setContact(contactDraft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminLayout
      title="Settings"
      subtitle="Configure SEO, payment and contact information"
      actions={
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Changes"}
        </button>
      }
    >
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === key
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
        {tab === "seo" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>Site Title</span>
              <input
                className={inputCls}
                placeholder="Enter your site title"
                value={seoDraft.siteTitle}
                onChange={(e) => setSeoDraft({ ...seoDraft, siteTitle: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Meta Description</span>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Enter your meta description"
                value={seoDraft.metaDescription}
                onChange={(e) => setSeoDraft({ ...seoDraft, metaDescription: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Meta Keywords</span>
              <input
                className={inputCls}
                placeholder="comma, separated, keywords"
                value={seoDraft.metaKeywords}
                onChange={(e) => setSeoDraft({ ...seoDraft, metaKeywords: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Canonical URL</span>
              <input
                className={inputCls}
                placeholder="https://example.com"
                value={seoDraft.canonicalUrl}
                onChange={(e) => setSeoDraft({ ...seoDraft, canonicalUrl: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Open Graph Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setOgImagePreview(URL.createObjectURL(file));
                  setUploadingOgImage(true);
                  try {
                    const url = await uploadImage(file);
                    setSeoDraft((cur) => ({ ...cur, ogImage: url }));
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Image upload failed", "error");
                  } finally {
                    setUploadingOgImage(false);
                  }
                }}
                className={`${inputCls} py-1.5`}
              />
              {ogImagePreview && (
                <img
                  src={ogImagePreview}
                  alt="Open Graph preview"
                  className="mt-2 h-28 w-28 rounded-xl border border-border object-cover"
                />
              )}
              {uploadingOgImage && (
                <p className="mt-1 text-[11px] text-muted-foreground">Uploading…</p>
              )}
            </label>
          </div>
        )}

        {tab === "payment" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input
                type="checkbox"
                checked={paymentDraft.razorpayEnabled}
                onChange={(e) =>
                  setPaymentDraft({ ...paymentDraft, razorpayEnabled: e.target.checked })
                }
              />
              Enable Razorpay online payments
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Razorpay Key ID</span>
              <input
                className={inputCls}
                placeholder="rzp_live_xxxxxxxx"
                value={paymentDraft.razorpayKeyId}
                onChange={(e) => setPaymentDraft({ ...paymentDraft, razorpayKeyId: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelCls}>UPI ID</span>
              <input
                className={inputCls}
                placeholder="nethras@upi"
                value={paymentDraft.upiId}
                onChange={(e) => setPaymentDraft({ ...paymentDraft, upiId: e.target.value })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={paymentDraft.codEnabled}
                onChange={(e) => setPaymentDraft({ ...paymentDraft, codEnabled: e.target.checked })}
              />
              Enable Cash on Delivery
            </label>
            <label className="block">
              <span className={labelCls}>Free Shipping Above (₹)</span>
              <input
                type="number"
                className={inputCls}
                placeholder="Enter free shipping amount"
                value={paymentDraft.freeShippingAbove}
                onChange={(e) =>
                  setPaymentDraft({ ...paymentDraft, freeShippingAbove: Number(e.target.value) })
                }
              />
            </label>
            <label className="block">
              <span className={labelCls}>Flat Shipping Fee (₹)</span>
              <input
                type="number"
                className={inputCls}
                placeholder="Enter flat shipping fee"
                value={paymentDraft.flatShippingFee}
                onChange={(e) =>
                  setPaymentDraft({ ...paymentDraft, flatShippingFee: Number(e.target.value) })
                }
              />
            </label>
          </div>
        )}

        {tab === "contact" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Support Email</span>
              <input
                type="email"
                className={inputCls}
                placeholder="Enter your support email"
                value={contactDraft.supportEmail}
                onChange={(e) => setContactDraft({ ...contactDraft, supportEmail: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Support Phone</span>
              <input
                type="tel"
                className={inputCls}
                placeholder="Enter your support phone"
                value={contactDraft.supportPhone}
                onChange={(e) => setContactDraft({ ...contactDraft, supportPhone: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelCls}>WhatsApp Number</span>
              <input
                type="tel"
                className={inputCls}
                placeholder="+91XXXXXXXXXX"
                value={contactDraft.whatsappNumber}
                onChange={(e) =>
                  setContactDraft({ ...contactDraft, whatsappNumber: e.target.value })
                }
              />
            </label>
            <label className="block">
              <span className={labelCls}>Instagram URL</span>
              <input
                className={inputCls}
                placeholder="Enter your Instagram URL"
                value={contactDraft.instagramUrl}
                onChange={(e) => setContactDraft({ ...contactDraft, instagramUrl: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Store Address</span>
              <textarea
                rows={3}
                className={inputCls}
                placeholder="Enter your store address"
                value={contactDraft.address}
                onChange={(e) => setContactDraft({ ...contactDraft, address: e.target.value })}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Facebook URL</span>
              <input
                className={inputCls}
                placeholder="Enter your Facebook URL"
                value={contactDraft.facebookUrl}
                onChange={(e) => setContactDraft({ ...contactDraft, facebookUrl: e.target.value })}
              />
            </label>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

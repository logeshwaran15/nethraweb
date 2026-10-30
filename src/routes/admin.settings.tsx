import { useEffect, useState } from "react";
import { CreditCard, Info, Mail, Phone, Save, Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdmin } from "@/lib/admin-store";
import { apiGet, apiPost, apiPut, uploadImage } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { confirmAction } from "@/lib/confirm";
import { Toggle } from "@/components/admin/Toggle";

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40";
const labelCls = "mb-1 block text-xs font-semibold text-muted-foreground";

const tabs = [
  { key: "about", label: "About Page", icon: Info },
  { key: "seo", label: "SEO", icon: Search },
  { key: "payment", label: "Payment", icon: CreditCard },
  { key: "contact", label: "Contact Details", icon: Phone },
  { key: "email", label: "Email", icon: Mail },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AdminSettings() {
  const [tab, setTab] = useState<TabKey>("about");
  const { about, setAbout, seo, setSeo, payment, setPayment, contact, setContact } = useAdmin();

  const [aboutDraft, setAboutDraft] = useState(about);
  const [seoDraft, setSeoDraft] = useState(seo);
  const [paymentDraft, setPaymentDraft] = useState(payment);
  const [contactDraft, setContactDraft] = useState(contact);

  // The saved settings arrive after the first render; keep the editable drafts in step with them
  // so an early "Save" can never overwrite real values with the empty defaults.
  useEffect(() => setAboutDraft(about), [about]);
  useEffect(() => setSeoDraft(seo), [seo]);
  useEffect(() => setPaymentDraft(payment), [payment]);
  useEffect(() => setContactDraft(contact), [contact]);

  const [emailDraft, setEmailDraft] = useState({
    SmtpHost: "",
    SmtpPort: "465",
    SmtpUser: "",
    SmtpPass: "",
    FromEmail: "",
    FromName: "",
  });
  const [emailHasPassword, setEmailHasPassword] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  type EmailRow = {
    SmtpHost: string | null;
    SmtpPort: string | number | null;
    SmtpUser: string | null;
    FromEmail: string | null;
    FromName: string | null;
    HasPassword: boolean;
  };
  const applyEmailRow = (r: EmailRow) => {
    setEmailDraft({
      SmtpHost: r.SmtpHost ?? "",
      SmtpPort: String(r.SmtpPort ?? "465"),
      SmtpUser: r.SmtpUser ?? "",
      SmtpPass: "",
      FromEmail: r.FromEmail ?? "",
      FromName: r.FromName ?? "",
    });
    setEmailHasPassword(r.HasPassword);
  };

  useEffect(() => {
    apiGet<EmailRow>("/api/email_settings.php")
      .then(applyEmailRow)
      .catch(() => {});
  }, []);

  const saveEmail = async () => {
    try {
      applyEmailRow(
        await apiPut<EmailRow>("/api/email_settings.php", {
          ...emailDraft,
          SmtpPort: Number(emailDraft.SmtpPort) || 465,
        }),
      );
      showToast("Email settings saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save email settings", "error");
    }
  };

  const sendTestEmail = async () => {
    setTesting(true);
    try {
      const r = await apiPost<{ message: string }>("/api/email_settings.php", {
        to: testTo.trim(),
      });
      showToast(r.message, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not send the test email", "error");
    } finally {
      setTesting(false);
    }
  };

  const [saved, setSaved] = useState(false);
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(null);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [aboutImagePreview, setAboutImagePreview] = useState<string | null>(null);
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false);

  const save = async () => {
    let ok: boolean | void = true;
    if (tab === "about") ok = await setAbout(aboutDraft);
    if (tab === "seo") ok = await setSeo(seoDraft);
    if (tab === "payment") ok = await setPayment(paymentDraft);
    if (tab === "contact") ok = await setContact(contactDraft);
    if (tab === "email") {
      ok = await confirmAction({
        title: "Update email settings?",
        message: "Are you sure you want to save your email settings changes?",
        confirmText: "Update",
      });
      if (ok) await saveEmail();
    }
    if (ok === false) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AdminLayout
      title="Settings"
      subtitle="Configure the About page, SEO, payment, contact and email settings"
      actions={
        <button
          onClick={save}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-card)]"
        >
          <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Changes"}
        </button>
      }
    >
      <div className="flex gap-2 overflow-x-auto rounded-sm border border-border bg-card p-1.5">
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

      <div className="mt-4 rounded-sm border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
        {tab === "about" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelCls}>Heading</span>
              <input
                className={inputCls}
                placeholder="e.g. Crafted with love, since 2020"
                value={aboutDraft.heading}
                onChange={(e) => setAboutDraft({ ...aboutDraft, heading: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Subheading</span>
              <input
                className={inputCls}
                placeholder="A short tagline under the heading"
                value={aboutDraft.subheading}
                onChange={(e) => setAboutDraft({ ...aboutDraft, subheading: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Story / Body</span>
              <p className="mb-1.5 text-[11px] text-muted-foreground">
                Leave a blank line between paragraphs.
              </p>
              <textarea
                rows={8}
                className={inputCls}
                placeholder="Tell customers your story…"
                value={aboutDraft.body}
                onChange={(e) => setAboutDraft({ ...aboutDraft, body: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Page Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAboutImagePreview(URL.createObjectURL(file));
                  setUploadingAboutImage(true);
                  try {
                    const url = await uploadImage(file);
                    setAboutDraft((cur) => ({ ...cur, image: url }));
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Image upload failed", "error");
                  } finally {
                    setUploadingAboutImage(false);
                  }
                }}
                className={`${inputCls} py-1.5`}
              />
              {(aboutImagePreview || aboutDraft.image) && (
                <img
                  src={aboutImagePreview ?? aboutDraft.image}
                  alt="About page preview"
                  className="mt-2 h-32 w-full max-w-xs rounded-xl border border-border object-cover"
                />
              )}
              {uploadingAboutImage && (
                <p className="mt-1 text-[11px] text-muted-foreground">Uploading…</p>
              )}
            </label>

            <p className="text-xs font-semibold text-muted-foreground sm:col-span-2">
              Optional highlight stats (e.g. "5000+ · Happy Customers"). Leave a label blank to hide
              that stat.
            </p>
            {(
              [
                ["stat1Label", "stat1Value", "Stat 1"],
                ["stat2Label", "stat2Value", "Stat 2"],
                ["stat3Label", "stat3Value", "Stat 3"],
              ] as const
            ).map(([labelKey, valueKey, title]) => (
              <div key={title} className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className={labelCls}>{title} Value</span>
                  <input
                    className={inputCls}
                    placeholder="5000+"
                    value={aboutDraft[valueKey]}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, [valueKey]: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>{title} Label</span>
                  <input
                    className={inputCls}
                    placeholder="Happy Customers"
                    value={aboutDraft[labelKey]}
                    onChange={(e) => setAboutDraft({ ...aboutDraft, [labelKey]: e.target.value })}
                  />
                </label>
              </div>
            ))}
          </div>
        )}

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
            <div className="space-y-3 sm:col-span-2">
              <Toggle
                label="Razorpay online payments"
                description="UPI, cards, net banking and wallets at checkout."
                checked={paymentDraft.razorpayEnabled}
                onChange={(v) => setPaymentDraft({ ...paymentDraft, razorpayEnabled: v })}
              />
              <Toggle
                label="Order on WhatsApp"
                description={
                  contactDraft.whatsappNumber.trim()
                    ? `Customers can place the order and send the details to ${contactDraft.whatsappNumber}.`
                    : "Set your WhatsApp number in the Contact tab, or this option will not appear at checkout."
                }
                checked={paymentDraft.whatsappOrderEnabled}
                onChange={(v) => setPaymentDraft({ ...paymentDraft, whatsappOrderEnabled: v })}
              />
            </div>
            <label className="block sm:col-span-2">
              <span className={labelCls}>Razorpay Key ID</span>
              <input
                className={inputCls}
                placeholder="rzp_live_xxxxxxxx"
                value={paymentDraft.razorpayKeyId}
                onChange={(e) =>
                  setPaymentDraft({ ...paymentDraft, razorpayKeyId: e.target.value })
                }
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

        {tab === "email" && (
          <div className="space-y-4">
            <p className="rounded-xl bg-[#FDF0F0] px-4 py-3 text-xs leading-relaxed text-[#786B6B]">
              These details are used to send password reset emails. For Gmail, use host{" "}
              <span className="font-semibold">smtp.gmail.com</span>, port{" "}
              <span className="font-semibold">465</span>, and an{" "}
              <span className="font-semibold">App password</span> (not your normal Gmail password).
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>SMTP Host</span>
                <input
                  className={inputCls}
                  placeholder="smtp.gmail.com"
                  value={emailDraft.SmtpHost}
                  onChange={(e) => setEmailDraft({ ...emailDraft, SmtpHost: e.target.value })}
                />
              </label>
              <label className="block">
                <span className={labelCls}>SMTP Port</span>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  placeholder="465"
                  value={emailDraft.SmtpPort}
                  onChange={(e) =>
                    setEmailDraft({
                      ...emailDraft,
                      SmtpPort: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                />
              </label>
              <label className="block">
                <span className={labelCls}>Email / Username</span>
                <input
                  className={inputCls}
                  placeholder="yourname@gmail.com"
                  value={emailDraft.SmtpUser}
                  onChange={(e) => setEmailDraft({ ...emailDraft, SmtpUser: e.target.value })}
                />
              </label>
              <label className="block">
                <span className={labelCls}>
                  App Password {emailHasPassword && "(saved — leave blank to keep it)"}
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  placeholder={emailHasPassword ? "••••••••••••••••" : "16-character app password"}
                  value={emailDraft.SmtpPass}
                  onChange={(e) => setEmailDraft({ ...emailDraft, SmtpPass: e.target.value })}
                />
              </label>
              <label className="block">
                <span className={labelCls}>From Email</span>
                <input
                  className={inputCls}
                  placeholder="Same as email if left blank"
                  value={emailDraft.FromEmail}
                  onChange={(e) => setEmailDraft({ ...emailDraft, FromEmail: e.target.value })}
                />
              </label>
              <label className="block">
                <span className={labelCls}>From Name</span>
                <input
                  className={inputCls}
                  placeholder="Nethra's"
                  value={emailDraft.FromName}
                  onChange={(e) => setEmailDraft({ ...emailDraft, FromName: e.target.value })}
                />
              </label>
            </div>

            <div className="border-t border-dashed border-border pt-4">
              <span className={labelCls}>Send a test email (uses the saved settings)</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  className={inputCls}
                  placeholder="Send test to…"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                />
                <button
                  type="button"
                  disabled={testing || !testTo.trim()}
                  onClick={sendTestEmail}
                  className="shrink-0 rounded-xl border border-primary px-5 py-2 text-sm font-semibold text-primary hover:bg-accent disabled:opacity-50"
                >
                  {testing ? "Sending…" : "Send Test"}
                </button>
              </div>
            </div>
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

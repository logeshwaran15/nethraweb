import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Heart,
  LogOut,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import logo from "@/assets/newlogo.jpeg";
import { Screen } from "@/components/shop/AppChrome";
import { Captcha, type CaptchaHandle } from "@/components/shop/Captcha";
import { Button } from "@/components/ui/button";
import { login as apiLogin, register as apiRegister } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

const links = [
  { to: "/orders", label: "My Orders", icon: Package },
  { to: "/wishlist", label: "My Wishlist", icon: Heart },
  { to: "/track", label: "Track Order", icon: MapPin },
] as const;

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, login: setLoggedInUser, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (mode === "register" && !/^[0-9]{10}$/.test(phone)) {
      setError("Phone number must be exactly 10 digits");
      return;
    }
    const captcha = captchaRef.current?.getAnswer();
    if (!captcha || captcha.captchaAnswer.length === 0) {
      setError("Please enter the captcha code");
      return;
    }
    setSubmitting(true);
    try {
      const {
        user: loggedInUser,
        token,
        redirectTo,
      } = mode === "login"
        ? await apiLogin(email, password, captcha)
        : await apiRegister(fullName, email, phone, password, captcha);
      setLoggedInUser(loggedInUser, token);
      if (loggedInUser.Role === "Admin") {
        navigate(redirectTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      captchaRef.current?.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <Screen title="My Account">
        <div className="p-4 md:mx-auto md:max-w-md md:p-8">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="text-body-lg font-semibold text-primary">
                Welcome back, {user.FullName}
              </p>
              <p className="text-caption text-muted-foreground">Manage your orders and wishlist.</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-primary shadow-[var(--shadow-card)]"
              >
                <Icon className="h-5 w-5 text-primary" />
                {label}
              </Link>
            ))}
          </div>

          <Button
            variant="outline"
            size="cta"
            className="mt-6 w-full text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="My Account">
      <div className="mx-auto max-w-sm p-4 py-8 md:py-12">
        <div className="flex flex-col items-center">
          <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-[#FFE4E8] shadow-[0_0_0_2px_var(--gold),0_6px_18px_rgba(142,24,40,0.15)]">
            <img src={logo} alt="Nethra's" className="h-full w-full object-cover" />
          </span>
          <h1 className="text-h2 mt-3 text-primary">Nethra&apos;s</h1>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="flex border-b border-border">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                mode === "login"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                mode === "register"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <div className="p-5">
            <h2 className="text-h3 text-primary">
              {mode === "login" ? "Welcome back \u{1F44B}" : "Create your account"}
            </h2>
            <p className="text-caption mt-1 text-muted-foreground">
              {mode === "login"
                ? "Sign in to continue shopping."
                : "Join Nethra's for a faster checkout experience."}
            </p>

            <form onSubmit={submit} className="mt-4 space-y-3.5">
              {mode === "register" && (
                <Field label="Full Name" icon={User}>
                  <input
                    required
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
              )}

              <Field label="Email Address" icon={Mail}>
                <input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </Field>

              {mode === "register" && (
                <Field label="Phone Number" icon={Phone}>
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Enter a 10-digit mobile number"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </Field>
              )}

              <Field label="Password" icon={Lock}>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((s) => !s)}
                  className="shrink-0 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              {mode === "login" && (
                <div className="-mt-1 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-caption font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Captcha key={mode} ref={captchaRef} />

              {error && (
                <p className="text-caption text-center font-medium text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                variant="brand"
                size="cta"
                className="w-full"
              >
                {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <p className="text-caption mt-4 text-center text-muted-foreground">
              {mode === "login" ? "New here?" : "Already have an account?"}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="font-semibold text-primary"
              >
                {mode === "login" ? "Create account" : "Sign In"}
              </button>
            </p>
          </div>

          <div className="text-caption flex items-center justify-center gap-1.5 border-t border-border py-3 font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-gold-soft" /> SSL Secure &amp; Privacy
            Protected
          </div>
        </div>

        <Link
          to="/"
          className="text-caption mt-4 block text-center font-semibold text-muted-foreground hover:text-primary"
        >
          &larr; Back to Nethra&apos;s
        </Link>
      </div>
    </Screen>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-label mb-1.5 block text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 focus-within:border-primary">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {children}
      </div>
    </label>
  );
}

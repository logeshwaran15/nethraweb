import { Link, useNavigate } from "react-router-dom";
import { Heart, LogOut, Lock, Mail, MapPin, Package, Phone, User } from "lucide-react";
import { useState } from "react";
import { Screen } from "@/components/shop/AppChrome";
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
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { user: loggedInUser, redirectTo } =
        mode === "login"
          ? await apiLogin(email, password)
          : await apiRegister(fullName, email, phone, password);
      setLoggedInUser(loggedInUser);
      if (loggedInUser.Role === "Admin") {
        navigate(redirectTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <Screen title="My Account">
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Welcome back, {user.FullName}</p>
              <p className="text-xs text-muted-foreground">Manage your orders and wishlist.</p>
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

          <button
            onClick={logout}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-destructive py-2.5 text-sm font-semibold text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="My Account">
      <div className="p-4">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold bg-secondary">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mt-3 text-center font-display text-xl font-semibold text-primary">
          {mode === "login" ? "Welcome Back" : "Create Your Account"}
        </h2>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {mode === "login"
            ? "Sign in to view your orders and wishlist."
            : "Join Nethra's for a faster checkout experience."}
        </p>

        <div className="mt-5 flex rounded-full border border-border bg-secondary/60 p-1">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
              mode === "login" ? "gradient-maroon text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode("register")}
            className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
              mode === "register" ? "gradient-maroon text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "register" && (
            <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <User className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                required
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
          )}

          <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              required
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          {mode === "register" && (
            <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                required
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
          )}

          <label className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          {mode === "login" && (
            <div className="text-right">
              <button type="button" className="text-xs font-medium text-primary">
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="text-center text-xs font-medium text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full gradient-maroon py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? "New to Nethra's?" : "Already have an account?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="font-semibold text-primary"
          >
            {mode === "login" ? "Register" : "Log In"}
          </button>
        </p>
      </div>
    </Screen>
  );
}

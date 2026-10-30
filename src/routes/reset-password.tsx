import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";
import { Screen } from "@/components/shop/AppChrome";
import { resetPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputWrap =
    "flex h-12 items-center gap-2.5 rounded-full border border-[#E9DADA] bg-[#FFF9F5] px-4 focus-within:border-[#8E1828] focus-within:ring-4 focus-within:ring-[#FDF0F0]";

  return (
    <Screen title="Reset Password" back>
      <div className="bg-[#FFF9F5] px-4 py-10 md:py-16">
        <div className="mx-auto max-w-md rounded-xl border border-[#E9DADA] bg-white p-6 shadow-[0_1px_8px_rgba(45,37,37,0.04)] md:p-8">
          {!token ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
                <ShieldAlert className="h-7 w-7" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-semibold text-[#2D2525]">
                Invalid reset link
              </h1>
              <p className="mt-2 text-sm text-[#786B6B]">
                This link is missing its reset code. Please request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="mt-5 inline-flex h-11 items-center rounded-full bg-[#8E1828] px-6 text-sm font-semibold text-white hover:bg-[#741421]"
              >
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#E3F4EA] text-[#2E9B61]">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-semibold text-[#2D2525]">
                Password updated
              </h1>
              <p className="mt-2 text-sm text-[#786B6B]">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Link
                to="/account"
                className="mt-5 inline-flex h-11 items-center rounded-full bg-[#8E1828] px-6 text-sm font-semibold text-white hover:bg-[#741421]"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
                <Lock className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-center font-display text-2xl font-semibold text-[#2D2525]">
                Set a new password
              </h1>
              <p className="mt-1 text-center text-sm text-[#786B6B]">
                Choose a password with at least 6 characters.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[#2D2525]">
                    New password
                  </span>
                  <span className={inputWrap}>
                    <Lock className="h-4 w-4 shrink-0 text-[#786B6B]" />
                    <input
                      required
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#786B6B]"
                    />
                    <button
                      type="button"
                      aria-label={show ? "Hide password" : "Show password"}
                      onClick={() => setShow((s) => !s)}
                      className="shrink-0 text-[#786B6B]"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[#2D2525]">
                    Confirm password
                  </span>
                  <span className={inputWrap}>
                    <Lock className="h-4 w-4 shrink-0 text-[#786B6B]" />
                    <input
                      required
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#786B6B]"
                    />
                  </span>
                </label>

                {error && (
                  <p className="text-center text-xs font-medium text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-full bg-[#8E1828] text-sm font-semibold text-white transition-colors hover:bg-[#741421] disabled:opacity-60"
                >
                  {submitting ? "Updating…" : "Reset Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Screen>
  );
}

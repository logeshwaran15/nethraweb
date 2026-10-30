import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from "lucide-react";
import { Screen } from "@/components/shop/AppChrome";
import { Captcha, type CaptchaHandle } from "@/components/shop/Captcha";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const captcha = captchaRef.current?.getAnswer();
    if (!captcha || captcha.captchaAnswer.length === 0) {
      setError("Please enter the captcha code");
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim(), captcha);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      captchaRef.current?.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Forgot Password" back>
      <div className="bg-[#FFF9F5] px-4 py-10 md:py-16">
        <div className="mx-auto max-w-md rounded-xl border border-[#E9DADA] bg-white p-6 shadow-[0_1px_8px_rgba(45,37,37,0.04)] md:p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#FDF0F0] text-[#8E1828]">
            {sent ? <CheckCircle2 className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
          </span>

          {sent ? (
            <div className="mt-4 text-center">
              <h1 className="font-display text-2xl font-semibold text-[#2D2525]">
                Check your email
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#786B6B]">
                If an account exists for{" "}
                <span className="font-semibold text-[#2D2525]">{email}</span>, we&apos;ve sent a
                link to reset your password. It expires in 30 minutes.
              </p>
              <p className="mt-3 text-xs text-[#786B6B]">
                Didn&apos;t get it? Check your spam folder, or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="font-semibold text-[#8E1828] underline"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <h1 className="mt-4 text-center font-display text-2xl font-semibold text-[#2D2525]">
                Forgot password?
              </h1>
              <p className="mt-1 text-center text-sm text-[#786B6B]">
                Enter your account email and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[#2D2525]">
                    Email address
                  </span>
                  <span className="flex h-12 items-center gap-2.5 rounded-full border border-[#E9DADA] bg-[#FFF9F5] px-4 focus-within:border-[#8E1828] focus-within:ring-4 focus-within:ring-[#FDF0F0]">
                    <Mail className="h-4 w-4 shrink-0 text-[#786B6B]" />
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#786B6B]"
                    />
                  </span>
                </label>

                <Captcha ref={captchaRef} />

                {error && (
                  <p className="text-center text-xs font-medium text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-full bg-[#8E1828] text-sm font-semibold text-white transition-colors hover:bg-[#741421] disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            </>
          )}

          <Link
            to="/account"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-[#786B6B] hover:text-[#8E1828]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </Screen>
  );
}

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from "react";
import { RefreshCw } from "lucide-react";
import { fetchCaptcha, type CaptchaAnswer } from "@/lib/api";

export type CaptchaHandle = {
  /** Current answer payload for the API, or null if the challenge hasn't loaded. */
  getAnswer: () => CaptchaAnswer | null;
  /** Load a fresh challenge (call after a failed attempt — each token is tied to one image). */
  refresh: () => void;
};

export const Captcha = forwardRef<CaptchaHandle>(function Captcha(_, ref) {
  const [challenge, setChallenge] = useState<{ token: string; image: string } | null>(null);
  const [answer, setAnswer] = useState("");
  const [failed, setFailed] = useState(false);

  const refresh = useCallback(() => {
    setChallenge(null);
    setAnswer("");
    setFailed(false);
    fetchCaptcha()
      .then(setChallenge)
      .catch(() => setFailed(true));
  }, []);

  useEffect(refresh, [refresh]);

  useImperativeHandle(
    ref,
    () => ({
      getAnswer: () =>
        challenge ? { captchaToken: challenge.token, captchaAnswer: answer.trim() } : null,
      refresh,
    }),
    [challenge, answer, refresh],
  );

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="grid h-[50px] w-[150px] shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-[#FDF0F0]">
          {challenge ? (
            <img src={challenge.image} alt="Captcha code" className="h-full w-full select-none" />
          ) : (
            <span className="text-xs text-muted-foreground">{failed ? "Failed to load" : "Loading…"}</span>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          aria-label="Get a new captcha"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border text-primary hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <input
          required
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Enter code"
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={5}
          className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-white px-3 text-sm uppercase tracking-widest outline-none placeholder:normal-case placeholder:tracking-normal focus:border-primary"
        />
      </div>
    </div>
  );
});

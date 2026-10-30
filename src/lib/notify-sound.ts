// Chimes generated with the Web Audio API — no audio file/dependency needed.
// Browsers keep audio suspended until the user interacts with the page, so a single
// shared context is created and resumed on the first click/tap/key press.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctx();
    }
    return ctx;
  } catch {
    return null;
  }
}

if (typeof window !== "undefined") {
  const unlock = () => {
    void getCtx()?.resume();
  };
  ["pointerdown", "keydown", "touchstart"].forEach((e) =>
    window.addEventListener(e, unlock, { passive: true }),
  );
}

function tones(freqs: number[], step: number, peak: number, offset = 0) {
  const c = getCtx();
  if (!c) return;
  void c.resume();
  const now = c.currentTime + offset;
  freqs.forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + i * step;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(start);
    osc.stop(start + 0.5);
  });
}

// Short two-tone ping for general notifications.
export function playNotifySound() {
  tones([880, 1320], 0.12, 0.3);
}

// Louder, longer chime (played twice) so a new order is hard to miss.
export function playOrderSound() {
  const notes = [784, 988, 1175, 1568];
  tones(notes, 0.15, 0.6);
  tones(notes, 0.15, 0.6, 1.1);
}

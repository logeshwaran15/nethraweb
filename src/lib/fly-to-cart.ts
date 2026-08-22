export function flyToCart(sourceImg: HTMLImageElement) {
  const target = document.getElementById("cart-icon-target");
  if (!target) return;

  const srcRect = sourceImg.getBoundingClientRect();
  const tgtRect = target.getBoundingClientRect();

  const clone = sourceImg.cloneNode(true) as HTMLImageElement;
  Object.assign(clone.style, {
    position: "fixed",
    left: `${srcRect.left}px`,
    top: `${srcRect.top}px`,
    width: `${srcRect.width}px`,
    height: `${srcRect.height}px`,
    borderRadius: "14px",
    objectFit: "cover",
    zIndex: "9999",
    pointerEvents: "none",
    boxShadow: "0 8px 24px -8px rgba(0,0,0,0.35)",
    transition: "transform 700ms cubic-bezier(0.55, 0, 0.85, 0.35), opacity 700ms ease-in",
    willChange: "transform, opacity",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(clone);

  const dx = tgtRect.left + tgtRect.width / 2 - (srcRect.left + srcRect.width / 2);
  const dy = tgtRect.top + tgtRect.height / 2 - (srcRect.top + srcRect.height / 2);

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(0.12)`;
    clone.style.opacity = "0.3";
  });

  const cleanup = () => {
    clone.remove();
    target.classList.add("animate-cart-bump");
    setTimeout(() => target.classList.remove("animate-cart-bump"), 350);
  };
  clone.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, 900); // safety fallback if transitionend doesn't fire
}

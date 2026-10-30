import { useEffect } from "react";
import { apiGet } from "@/lib/api";

type SeoRow = { SiteTitle: string | null; OgImagePath: string | null };

const META_KEYS = ['meta[name="description"]', 'meta[property="og:description"]'] as const;
const OG_TITLE = 'meta[property="og:title"]';

function getMeta(selector: string): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, key, value] = selector.match(/\[(\w+)="([^"]+)"]/) ?? [];
    if (key && value) el.setAttribute(key, value);
    document.head.appendChild(el);
  }
  return el;
}

/**
 * Sets a page-specific document title and description (also mirrored to the
 * Open Graph tags) from dynamic page content, suffixed with the admin-configured
 * site title. The previous values are restored when the page unmounts.
 */
export function usePageSeo(title: string, description?: string | null) {
  useEffect(() => {
    const prevTitle = document.title;
    const [descEl, ogDescEl, ogTitleEl] = [...META_KEYS, OG_TITLE].map((s) => getMeta(s)) as [
      HTMLMetaElement,
      HTMLMetaElement,
      HTMLMetaElement,
    ];
    const targets = [descEl, ogDescEl, ogTitleEl];
    const prev = targets.map((el) => el.getAttribute("content"));
    let cancelled = false;

    const apply = (siteTitle?: string | null) => {
      const full = siteTitle ? `${title} | ${siteTitle}` : title;
      document.title = full;
      ogTitleEl.setAttribute("content", full);
      if (description) {
        descEl.setAttribute("content", description);
        ogDescEl.setAttribute("content", description);
      }
    };

    apply();
    apiGet<SeoRow>("/api/seo_settings.php")
      .then((r) => {
        if (!cancelled) apply(r.SiteTitle);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      document.title = prevTitle;
      targets.forEach((el, i) => {
        if (prev[i] === null) el.removeAttribute("content");
        else el.setAttribute("content", prev[i]!);
      });
    };
  }, [title, description]);
}

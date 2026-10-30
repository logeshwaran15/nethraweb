import { useEffect } from "react";
import { apiGet } from "@/lib/api";

type SeoRow = {
  SiteTitle: string | null;
  MetaDescription: string | null;
  MetaKeywords: string | null;
  OgImagePath: string | null;
  CanonicalUrl: string | null;
};

function setMeta(selector: string, attr: string, content: string) {
  let el = document.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!el) {
    const tagName = selector.startsWith("link") ? "link" : "meta";
    el = document.createElement(tagName) as HTMLMetaElement | HTMLLinkElement;
    if (tagName === "meta") {
      const [, key, value] = selector.match(/\[(\w+)="([^"]+)"]/) ?? [];
      if (key && value) el.setAttribute(key, value);
    } else {
      el.setAttribute("rel", "canonical");
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, content);
}

/**
 * Applies the admin-configured SEO settings (site title, meta tags, canonical
 * URL, OG image) to the live document head. Mounted once at the app root so
 * changes saved in Admin → Settings → SEO show up on the storefront without
 * a redeploy.
 */
export function SeoHead() {
  useEffect(() => {
    apiGet<SeoRow>("/api/seo_settings.php")
      .then((r) => {
        if (r.SiteTitle) document.title = r.SiteTitle;
        if (r.MetaDescription) {
          setMeta('meta[name="description"]', "content", r.MetaDescription);
          setMeta('meta[property="og:description"]', "content", r.MetaDescription);
        }
        if (r.MetaKeywords) setMeta('meta[name="keywords"]', "content", r.MetaKeywords);
        if (r.SiteTitle) setMeta('meta[property="og:title"]', "content", r.SiteTitle);
        if (r.OgImagePath) setMeta('meta[property="og:image"]', "content", r.OgImagePath);
        if (r.CanonicalUrl) setMeta('link[rel="canonical"]', "href", r.CanonicalUrl);
      })
      .catch(() => {
        // keep the static defaults from index.html if settings can't be loaded
      });
  }, []);

  return null;
}

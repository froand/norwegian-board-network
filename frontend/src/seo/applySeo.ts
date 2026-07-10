/**
 * Runtime SEO for the single-page app.
 *
 * The static <head> in index.html carries the canonical crawlable metadata
 * (title, description, canonical, Open Graph, JSON-LD). Because the UI has a
 * Norwegian/English language toggle on the same URL, this helper keeps the
 * document title, description, <html lang> and og:locale in sync with the
 * currently selected language.
 */

import { ALLOW_INDEXING, getLocaleMeta } from './siteConfig';

function upsertMeta(
  selectorAttr: 'name' | 'property',
  key: string,
  content: string
): void {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${selectorAttr}="${key}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(selectorAttr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Apply language-dependent metadata for the given UI locale. */
export function applySeo(locale: string): void {
  const meta = getLocaleMeta(locale);

  document.documentElement.lang = meta.lang;
  document.title = meta.title;

  upsertMeta('name', 'description', meta.description);
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:locale', meta.ogLocale);
  upsertMeta('name', 'twitter:title', meta.title);
  upsertMeta('name', 'twitter:description', meta.description);

  // Safety net: never let a non-production environment get indexed, even if
  // the static build was produced without the noindex token.
  if (!ALLOW_INDEXING) {
    upsertMeta('name', 'robots', 'noindex, nofollow');
  }
}

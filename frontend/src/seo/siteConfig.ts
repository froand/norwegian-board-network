/**
 * Central SEO configuration — single source of truth for all metadata,
 * canonical URLs, Open Graph, JSON-LD and sitemap generation.
 *
 * Do not hardcode the domain in components. Import from here instead.
 * The production domain can be overridden at build time with VITE_SITE_URL.
 */

const DEFAULT_SITE_URL = 'https://www.norsknettverk.com';

/** Remove any trailing slash so we can safely append paths. */
function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/** Canonical base URL (always https + www, no trailing slash). */
export const SITE_URL = normalizeBaseUrl(
  import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL
);

/**
 * Whether this environment is allowed to be indexed by search engines.
 * Production => true. Preview/staging => set VITE_ALLOW_INDEXING=false.
 */
export const ALLOW_INDEXING =
  String(import.meta.env.VITE_ALLOW_INDEXING ?? 'true').toLowerCase() !== 'false';

/** Build an absolute URL from a site-relative path. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${suffix}`;
}

interface LocalizedMeta {
  title: string;
  description: string;
  /** BCP-47 language tag used on <html lang> and og:locale. */
  lang: string;
  ogLocale: string;
}

/**
 * Real, factual copy for the two supported UI languages.
 * No invented services, prices, locations or claims — this describes
 * exactly what the application does.
 */
export const siteConfig = {
  /** Public brand / site name. */
  name: 'Norsk Nettverk',
  url: SITE_URL,
  /** Default social share image (site-relative). */
  ogImage: '/og-image.svg',
  /** Verifiable external profiles only. */
  sameAs: ['https://github.com/froand/norwegian-board-network'],
  /** Primary UI language of the site. */
  defaultLocale: 'no' as const,
  locales: {
    no: {
      lang: 'nb',
      ogLocale: 'nb_NO',
      title: 'Norsk Nettverk – styre, makt og interessekonflikter',
      description:
        'Utforsk forbindelser mellom norske politikere, styreverv og selskaper. ' +
        'Interaktiv graf basert på åpne data fra Stortinget, Brønnøysundregistrene og regjeringen.no.',
    },
    en: {
      lang: 'en',
      ogLocale: 'en_US',
      title: 'Norsk Nettverk – Norwegian boards, power & conflicts of interest',
      description:
        'Explore connections between Norwegian politicians, board positions and companies. ' +
        'An interactive graph built on open data from the Storting, the Brønnøysund registers and the government.',
    },
  } satisfies Record<'no' | 'en', LocalizedMeta>,
};

export type SeoLocale = keyof typeof siteConfig.locales;

/** Resolve localized metadata, falling back to the default locale. */
export function getLocaleMeta(locale: string): LocalizedMeta {
  return (
    siteConfig.locales[locale as SeoLocale] ??
    siteConfig.locales[siteConfig.defaultLocale]
  );
}

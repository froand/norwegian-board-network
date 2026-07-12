import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_SITE_URL = 'https://www.norsknettverk.com';

/**
 * Date the site's indexable content was last meaningfully changed.
 * Used for sitemap <lastmod>. Bump this only on real content changes —
 * not on every deploy.
 */
const CONTENT_LAST_MODIFIED = '2026-07-10';

/**
 * Environment-driven SEO for the build:
 *  1. Replaces tokens in index.html so the canonical URL, Open Graph URLs,
 *     JSON-LD and robots directive are correct in the static HTML the crawler
 *     receives (no client JS required).
 *  2. Generates robots.txt and sitemap.xml from the same config, so all three
 *     always agree on the domain and indexing state.
 *
 * Tokens replaced in HTML:
 *   __SITE_URL__  -> VITE_SITE_URL (trailing slash stripped)
 *   __ROBOTS__    -> "index, follow" | "noindex, nofollow" (from VITE_ALLOW_INDEXING)
 */
function seoPlugin(env: Record<string, string>): Plugin {
  const siteUrl = (env.VITE_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
  const allowIndexing =
    String(env.VITE_ALLOW_INDEXING ?? 'true').toLowerCase() !== 'false';
  const robots = allowIndexing ? 'index, follow' : 'noindex, nofollow';

  const robotsTxt = allowIndexing
    ? `# robots.txt for ${siteUrl}
# Public production site — allow crawling of all pages.

User-agent: *
Allow: /

# Backend API and health endpoints hold no indexable content.
Disallow: /api/

Sitemap: ${siteUrl}/sitemap.xml
`
    : `# robots.txt for ${siteUrl}
# Non-production environment — keep search engines out entirely.

User-agent: *
Disallow: /
`;

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Single-page application: exactly one real, indexable URL (the interactive
  network explorer). No separate service/location/article pages exist.
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${CONTENT_LAST_MODIFIED}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

  return {
    name: 'seo-plugin',
    transformIndexHtml(html) {
      return html
        .replace(/__SITE_URL__/g, siteUrl)
        .replace(/__ROBOTS__/g, robots);
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), seoPlugin(env)],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});

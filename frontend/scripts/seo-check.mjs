#!/usr/bin/env node
/**
 * Dependency-free SEO checks for the built frontend (dist/).
 *
 * Run AFTER `vite build`:
 *   node scripts/seo-check.mjs
 *
 * Validates the static HTML the crawler actually receives, plus robots.txt and
 * sitemap.xml. Fails the build on critical SEO regressions.
 *
 * Environment (optional, must match the build):
 *   VITE_SITE_URL        canonical origin (default https://www.norsknettverk.com)
 *   VITE_ALLOW_INDEXING  'false' => expect noindex; otherwise expect index
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const SITE_URL = (process.env.VITE_SITE_URL || 'https://www.norsknettverk.com').replace(/\/+$/, '');
const ALLOW_INDEXING = String(process.env.VITE_ALLOW_INDEXING ?? 'true').toLowerCase() !== 'false';
const expectedHost = new URL(SITE_URL).host; // e.g. www.norsknettverk.com

const errors = [];
const warnings = [];
const pass = [];

const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);
const ok = (msg) => pass.push(msg);

function read(file) {
  const p = join(distDir, file);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

function attr(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
}

// ---------------------------------------------------------------------------
// index.html
// ---------------------------------------------------------------------------
const html = read('index.html');
if (!html) {
  fail('dist/index.html not found — did you run `vite build` first?');
} else {
  // No unresolved build tokens must remain anywhere.
  if (/__SITE_URL__|__ROBOTS__/.test(html)) {
    fail('index.html contains unresolved SEO tokens (__SITE_URL__ / __ROBOTS__).');
  } else {
    ok('No unresolved SEO tokens in index.html.');
  }

  // <html lang>
  const lang = attr(html, /<html[^>]*\blang="([^"]+)"/i);
  if (!lang) fail('<html> is missing a lang attribute.');
  else ok(`<html lang="${lang}">.`);

  // <title>
  const title = attr(html, /<title>([^<]*)<\/title>/i);
  if (!title) fail('Missing <title>.');
  else if (title.length < 10 || title.length > 70) warn(`<title> length ${title.length} is outside 10–70 chars: "${title}".`);
  else ok(`<title> present (${title.length} chars).`);

  // meta description
  const desc = attr(html, /<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
  if (!desc) fail('Missing meta description.');
  else if (desc.length < 50 || desc.length > 165) warn(`meta description length ${desc.length} is outside 50–165 chars.`);
  else ok(`meta description present (${desc.length} chars).`);

  // canonical
  const canonical = attr(html, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
  if (!canonical) fail('Missing canonical link.');
  else {
    try {
      const u = new URL(canonical);
      if (u.protocol !== 'https:') fail(`Canonical is not https: ${canonical}`);
      else if (u.host !== expectedHost) fail(`Canonical host "${u.host}" != expected "${expectedHost}".`);
      else ok(`Canonical uses https + correct host (${canonical}).`);
    } catch {
      fail(`Canonical is not an absolute URL: ${canonical}`);
    }
  }

  // robots
  const robots = attr(html, /<meta[^>]*name="robots"[^>]*content="([^"]*)"/i);
  if (!robots) fail('Missing meta robots.');
  else if (ALLOW_INDEXING && /noindex/i.test(robots)) {
    fail(`Production build is marked noindex ("${robots}") but VITE_ALLOW_INDEXING is not false.`);
  } else if (!ALLOW_INDEXING && !/noindex/i.test(robots)) {
    fail(`Non-production build should be noindex but robots is "${robots}".`);
  } else {
    ok(`meta robots = "${robots}" (matches ALLOW_INDEXING=${ALLOW_INDEXING}).`);
  }

  // Open Graph
  for (const prop of ['og:title', 'og:description', 'og:url', 'og:image', 'og:type']) {
    const val = attr(html, new RegExp(`<meta[^>]*property="${prop}"[^>]*content="([^"]*)"`, 'i'));
    if (!val) fail(`Missing Open Graph tag ${prop}.`);
  }
  const ogUrl = attr(html, /<meta[^>]*property="og:url"[^>]*content="([^"]*)"/i);
  if (ogUrl && !ogUrl.includes(expectedHost)) fail(`og:url does not use ${expectedHost}: ${ogUrl}`);
  if (!errors.some((e) => e.startsWith('Missing Open Graph'))) ok('Open Graph tags present and use correct host.');

  // Twitter card
  const twitter = attr(html, /<meta[^>]*name="twitter:card"[^>]*content="([^"]*)"/i);
  if (!twitter) warn('Missing twitter:card.');
  else ok(`twitter:card = "${twitter}".`);

  // JSON-LD
  const ldMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  if (ldMatches.length === 0) {
    fail('No JSON-LD structured data found.');
  } else {
    let ldOk = true;
    for (const m of ldMatches) {
      try {
        const json = JSON.parse(m[1]);
        const text = JSON.stringify(json);
        if (text.includes('__SITE_URL__')) { fail('JSON-LD contains unresolved __SITE_URL__ token.'); ldOk = false; }
        if (!text.includes(expectedHost)) { fail(`JSON-LD does not reference expected host ${expectedHost}.`); ldOk = false; }
      } catch (e) {
        fail(`JSON-LD is not valid JSON: ${e.message}`);
        ldOk = false;
      }
    }
    if (ldOk) ok(`JSON-LD valid (${ldMatches.length} block(s)) and references ${expectedHost}.`);
  }

  // og:image asset exists in dist
  const ogImage = attr(html, /<meta[^>]*property="og:image"[^>]*content="([^"]*)"/i);
  if (ogImage) {
    let imgPath;
    try { imgPath = new URL(ogImage).pathname; } catch { imgPath = ogImage; }
    if (!existsSync(join(distDir, imgPath))) fail(`og:image asset not found in dist: ${imgPath}`);
    else ok(`og:image asset exists in dist (${imgPath}).`);
  }
}

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------
const robotsTxt = read('robots.txt');
if (!robotsTxt) {
  fail('dist/robots.txt not found.');
} else if (!ALLOW_INDEXING) {
  // Non-production: blocking the whole site is the correct, expected behaviour.
  if (/^\s*Disallow:\s*\/\s*$/im.test(robotsTxt)) {
    ok('robots.txt blocks crawling (expected for non-production build).');
  } else {
    fail('Non-production robots.txt should block crawling with "Disallow: /".');
  }
} else {
  if (/^\s*Disallow:\s*\/\s*$/im.test(robotsTxt) && /User-agent:\s*\*/i.test(robotsTxt)) {
    fail('robots.txt blocks the whole site with "Disallow: /".');
  }
  const sm = robotsTxt.match(/Sitemap:\s*(\S+)/i);
  if (!sm) fail('robots.txt is missing a Sitemap: directive.');
  else if (!sm[1].startsWith('https://') || !sm[1].includes(expectedHost)) {
    fail(`robots.txt Sitemap does not use https + ${expectedHost}: ${sm[1]}`);
  } else {
    ok(`robots.txt present with Sitemap ${sm[1]}.`);
  }
}

// ---------------------------------------------------------------------------
// sitemap.xml
// ---------------------------------------------------------------------------
const sitemap = read('sitemap.xml');
if (!sitemap) {
  fail('dist/sitemap.xml not found.');
} else {
  if (/__SITE_URL__/.test(sitemap)) fail('sitemap.xml contains unresolved __SITE_URL__ token.');
  const locs = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
  if (locs.length === 0) {
    fail('sitemap.xml contains no <loc> entries.');
  } else {
    let smOk = true;
    for (const loc of locs) {
      let u;
      try { u = new URL(loc); } catch { fail(`sitemap <loc> is not absolute: ${loc}`); smOk = false; continue; }
      if (u.protocol !== 'https:') { fail(`sitemap <loc> not https: ${loc}`); smOk = false; }
      if (u.host !== expectedHost) { fail(`sitemap <loc> host "${u.host}" != "${expectedHost}".`); smOk = false; }
      if (/\/api\//i.test(u.pathname)) { fail(`sitemap includes an API URL: ${loc}`); smOk = false; }
    }
    const dupes = locs.filter((v, i) => locs.indexOf(v) !== i);
    if (dupes.length) { fail(`sitemap contains duplicate URLs: ${[...new Set(dupes)].join(', ')}`); smOk = false; }
    if (smOk) ok(`sitemap.xml valid (${locs.length} URL(s), https + ${expectedHost}, no duplicates).`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\nSEO check for', SITE_URL, `(ALLOW_INDEXING=${ALLOW_INDEXING})\n`);
for (const p of pass) console.log('  \u2713', p);
for (const w of warnings) console.log('  \u26a0', w);
for (const e of errors) console.log('  \u2717', e);

console.log(`\n${pass.length} passed, ${warnings.length} warning(s), ${errors.length} error(s).\n`);

if (errors.length > 0) {
  console.error('SEO check FAILED.');
  process.exit(1);
}
console.log('SEO check passed.');

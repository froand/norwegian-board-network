/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Canonical production site URL, e.g. https://www.norsknettverk.com */
  readonly VITE_SITE_URL?: string;
  /** 'false' disables indexing (preview/staging). Anything else => indexable. */
  readonly VITE_ALLOW_INDEXING?: string;
  /** Backend API base URL. */
  readonly VITE_API_URL?: string;
  /** Application Insights connection string. */
  readonly VITE_APPINSIGHTS_CONNECTION_STRING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

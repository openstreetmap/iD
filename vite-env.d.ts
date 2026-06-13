/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ID_PRESETS_CDN_URL: string | undefined;
  readonly ID_OCI_CDN_URL: string | undefined;
  readonly ID_NSI_CDN_URL: string | undefined;
  readonly ID_WMF_SITEMATRIX_CDN_URL: string | undefined;
  readonly ID_API_CONNECTION_URL: string | undefined;
  readonly ID_API_CONNECTION_API_URL: string | undefined;
  readonly ID_API_CONNECTION_CLIENT_ID: string | undefined;
  readonly ID_API_CONNECTION: string | undefined;
  readonly ID_TAGINFO_API_URL: string | undefined;
  readonly ID_NOMINATIM_API_URL: string | undefined;
  readonly ID_SHOW_DONATION_MESSAGE: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    /** @deprecated Debug-only. Use container DOM `.iD` once #11039 is resolved. */
    context?: iD.Context;
    /** @deprecated Debug-only. */
    id?: iD.Context;
  }
}

export {};

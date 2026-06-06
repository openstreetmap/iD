/**
 * Client env values from import.meta.env (Vite envPrefix: 'ID_').
 * Used by config/id.ts for CDN URLs, API connection, and feature flags.
 */
export const idPresetsCdnUrl: string | null = import.meta.env.ID_PRESETS_CDN_URL ?? null;
export const idOciCdnUrl: string | null = import.meta.env.ID_OCI_CDN_URL ?? null;
export const idNsiCdnUrl: string | null = import.meta.env.ID_NSI_CDN_URL ?? null;
export const idWmfSitematrixCdnUrl: string | null = import.meta.env.ID_WMF_SITEMATRIX_CDN_URL ?? null;
export const idApiConnectionUrl: string | null = import.meta.env.ID_API_CONNECTION_URL ?? null;
export const idApiConnectionApiUrl: string | null = import.meta.env.ID_API_CONNECTION_API_URL ?? null;
export const idApiConnectionClientId: string | null = import.meta.env.ID_API_CONNECTION_CLIENT_ID ?? null;
export const idApiConnection: string | null = import.meta.env.ID_API_CONNECTION ?? null;
export const idTaginfoApiUrl: string | null = import.meta.env.ID_TAGINFO_API_URL ?? null;
export const idNominatimApiUrl: string | null = import.meta.env.ID_NOMINATIM_API_URL ?? null;
export const idShowDonationMessage: string | null = import.meta.env.ID_SHOW_DONATION_MESSAGE ?? null;

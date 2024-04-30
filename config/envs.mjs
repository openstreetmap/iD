/* eslint-disable no-process-env */

import dotenv from 'dotenv';

dotenv.config();
const envs = {
  ENV__ID_PRESETS_CDN_URL: JSON.stringify(process.env.ID_PRESETS_CDN_URL || null),
  ENV__ID_OCI_CDN_URL: JSON.stringify(process.env.ID_OCI_CDN_URL || null),
  ENV__ID_NSI_CDN_URL: JSON.stringify(process.env.ID_NSI_CDN_URL || null),
  ENV__ID_WMF_SITEMATRIX_CDN_URL: JSON.stringify(process.env.ID_WMF_SITEMATRIX_CDN_URL || null),

  ENV__ID_API_CONNECTION_URL: JSON.stringify(process.env.ID_API_CONNECTION_URL || null),
  ENV__ID_API_CONNECTION_CLIENT_ID: JSON.stringify(process.env.ID_API_CONNECTION_CLIENT_ID || null),
  ENV__ID_API_CONNECTION_CLIENT_SECRET: JSON.stringify(process.env.ID_API_CONNECTION_CLIENT_SECRET || null),
  ENV__ID_API_CONNECTION: JSON.stringify(process.env.ID_API_CONNECTION || null),

  ENV__ID_TAGINFO_API_URL: JSON.stringify(process.env.ID_TAGINFO_API_URL || null),
  ENV__ID_NOMINATIM_API_URL: JSON.stringify(process.env.ID_NOMINATIM_API_URL || null),

  ENV__ID_SHOW_DONATION_MESSAGE: JSON.stringify(process.env.ID_SHOW_DONATION_MESSAGE || null),
};

export default envs;

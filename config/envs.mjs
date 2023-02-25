import dotenv from 'dotenv';

dotenv.config();
const envs = {
  ENV__ID_PRESETS_CDN_URL: JSON.stringify(process.env.ID_PRESETS_CDN_URL || null),
  ENV__ID_API_CONNECTION_URL: JSON.stringify(process.env.ID_API_CONNECTION_URL || null),
  ENV__ID_API_CONNECTION_CLIENT_ID: JSON.stringify(process.env.ID_API_CONNECTION_CLIENT_ID || null),
  ENV__ID_API_CONNECTION_CLIENT_SECRET: JSON.stringify(process.env.ID_API_CONNECTION_CLIENT_SECRET || null),
  ENV__ID_API_CONNECTION: JSON.stringify(process.env.ID_API_CONNECTION || null)
}

export default envs;

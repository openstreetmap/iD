import dotenv from 'dotenv';

dotenv.config();
const envs = {
  ID_PRESETS_CDN_URL: JSON.stringify(process.env.ID_PRESETS_CDN_URL || null)
}

export default envs;

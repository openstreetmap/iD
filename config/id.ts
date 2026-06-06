import {
  idPresetsCdnUrl,
  idOciCdnUrl,
  idNsiCdnUrl,
  idWmfSitematrixCdnUrl,
  idApiConnectionUrl,
  idApiConnectionApiUrl,
  idApiConnectionClientId,
  idApiConnection,
  idTaginfoApiUrl,
  idNominatimApiUrl,
  idShowDonationMessage
} from './env.js';

export interface OsmApiConnection {
  url: string;
  apiUrl?: string;
  client_id: string;
}

type OsmApiConnectionKey = 'live' | 'dev';

// cdns for external data packages
const presetsCdnUrl = idPresetsCdnUrl
  || 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@{presets_version}/';
const ociCdnUrl = idOciCdnUrl
  || 'https://cdn.jsdelivr.net/npm/osm-community-index@{version}/';
const wmfSitematrixCdnUrl = idWmfSitematrixCdnUrl
  || 'https://cdn.jsdelivr.net/npm/wmf-sitematrix@{version}/';
const nsiCdnUrl = idNsiCdnUrl
  || 'https://cdn.jsdelivr.net/npm/name-suggestion-index@{version}/';

// api urls and settings
const defaultOsmApiConnections: Record<OsmApiConnectionKey, OsmApiConnection> = {
  live: {
    url: 'https://www.openstreetmap.org',
    apiUrl: 'https://api.openstreetmap.org',
    client_id: '0tmNTmd0Jo1dQp4AUmMBLtGiD9YpMuXzHefitcuVStc'
  },
  dev: {
    url: 'https://api06.dev.openstreetmap.org',
    client_id: 'Ee1wWJ6UlpERbF6BfTNOpwn0R8k_06mvMXdDUkeHMgw'
  }
};

const osmApiConnections: OsmApiConnection[] = [];

if (idApiConnectionUrl !== null &&
    idApiConnectionClientId !== null) {
  // user specified API Oauth2 connection details
  // see https://wiki.openstreetmap.org/wiki/OAuth#OAuth_2.0_2
  osmApiConnections.push({
    url: idApiConnectionUrl,
    apiUrl: idApiConnectionApiUrl || idApiConnectionUrl,
    client_id: idApiConnectionClientId
  });
} else if (idApiConnection !== null &&
  idApiConnection in defaultOsmApiConnections) {
  // if environment variable ID_API_CONNECTION is either "live" or "dev":
  // only allow to connect to the respective OSM server
  osmApiConnections.push(defaultOsmApiConnections[idApiConnection as OsmApiConnectionKey]);
} else {
  // offer both "live" and "dev" servers by default
  osmApiConnections.push(defaultOsmApiConnections.live);
  osmApiConnections.push(defaultOsmApiConnections.dev);
}

// auxiliary OSM services
const taginfoApiUrl = idTaginfoApiUrl
  || 'https://taginfo.openstreetmap.org/api/4/';
const nominatimApiUrl = idNominatimApiUrl
  || 'https://nominatim.openstreetmap.org/';

// support/donation message on upload success screen
const showDonationMessage = idShowDonationMessage !== 'false';

export {
  presetsCdnUrl,
  ociCdnUrl,
  wmfSitematrixCdnUrl,
  nsiCdnUrl,
  osmApiConnections,
  taginfoApiUrl,
  nominatimApiUrl,
  showDonationMessage
};

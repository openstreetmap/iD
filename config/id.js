// cdns for external data packages
const presetsCdnUrl = 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@{presets_version}/';
const ociCdnUrl = 'https://cdn.jsdelivr.net/npm/osm-community-index@{version}/';
const wmfSitematrixCdnUrl = 'https://cdn.jsdelivr.net/npm/wmf-sitematrix@{version}/';
const nsiCdnUrl = 'https://cdn.jsdelivr.net/npm/name-suggestion-index@{version}/';

// api urls and settings
const osmApiConnections = [
  { // "live" db
    url: 'https://www.openstreetmap.org',
    client_id: '0tmNTmd0Jo1dQp4AUmMBLtGiD9YpMuXzHefitcuVStc',
    client_secret: 'BTlNrNxIPitHdL4sP2clHw5KLoee9aKkA7dQbc0Bj7Q'
  }, { // "dev" db
    url: 'https://api06.dev.openstreetmap.org',
    client_id: 'Ee1wWJ6UlpERbF6BfTNOpwn0R8k_06mvMXdDUkeHMgw',
    client_secret: 'OnfWFC-JkZNHyYdr_viNn_h_RTZXRslKcUxllOXqf5g'
  }
];
const taginfoApiUrl = 'https://taginfo.openstreetmap.org/api/4/';
const nominatimApiUrl = 'https://nominatim.openstreetmap.org/';

export {
  presetsCdnUrl,
  ociCdnUrl,
  wmfSitematrixCdnUrl,
  nsiCdnUrl,
  osmApiConnections,
  taginfoApiUrl,
  nominatimApiUrl,
};

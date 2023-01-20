import parseVersion from 'vparse';
import { presetsCdnUrlTemplate, ociCdnUrlTemplate, wmfSitematrixCdnUrlTemplate } from '../../config/id.js';
import { utilStringQs } from '../util';

import packageJSON from '../../package.json';

let _mainFileFetcher = coreFileFetcher(); // singleton

export { _mainFileFetcher as fileFetcher };

//
// coreFileFetcher asynchronously fetches data from JSON files
//
export function coreFileFetcher() {
  const presetsVersion = packageJSON.devDependencies['@openstreetmap/id-tagging-schema'];
  let presetsCdnUrl = presetsCdnUrlTemplate.replace('{presets_version}', presetsVersion);
  // Allow to overwrite the preset source to enable testing PRs for the id-editor-presets repo.
  const presetUrlOverwrite = utilStringQs(window.location.hash)?.presetUrlOverwrote;
  if (presetUrlOverwrite) {
    presetsCdnUrl = presetUrlOverwrite;
    console.info('`presetUrlOverwrite` applied. Presets are fetched from', presetsCdnUrl);
  }

  const ociVersion = packageJSON.dependencies['osm-community-index'] || packageJSON.devDependencies['osm-community-index'];
  const v = parseVersion(ociVersion);
  const ociVersionMinor = `${v.major}.${v.minor}`;
  const ociCdnUrl = ociCdnUrlTemplate.replace('{version}', ociVersionMinor);

  const wmfSitematrixCdnUrl = wmfSitematrixCdnUrlTemplate.replace('{version}', '0.1');

  let _this = {};
  let _inflight = {};
  let _fileMap = {
    'address_formats': 'data/address_formats.min.json',
    'imagery': 'data/imagery.min.json',
    'intro_graph': 'data/intro_graph.min.json',
    'keepRight': 'data/keepRight.min.json',
    'languages': 'data/languages.min.json',
    'locales': 'locales/index.min.json',
    'phone_formats': 'data/phone_formats.min.json',
    'qa_data': 'data/qa_data.min.json',
    'shortcuts': 'data/shortcuts.min.json',
    'territory_languages': 'data/territory_languages.min.json',
    'oci_defaults': ociCdnUrl + 'dist/defaults.min.json',
    'oci_features': ociCdnUrl + 'dist/featureCollection.min.json',
    'oci_resources': ociCdnUrl + 'dist/resources.min.json',
    'presets_package': presetsCdnUrl + 'package.json',
    'deprecated': presetsCdnUrl + 'dist/deprecated.min.json',
    'discarded': presetsCdnUrl + 'dist/discarded.min.json',
    'preset_categories': presetsCdnUrl + 'dist/preset_categories.min.json',
    'preset_defaults': presetsCdnUrl + 'dist/preset_defaults.min.json',
    'preset_fields': presetsCdnUrl + 'dist/fields.min.json',
    'preset_presets': presetsCdnUrl + 'dist/presets.min.json',
    'wmf_sitematrix': wmfSitematrixCdnUrl + 'wikipedia.min.json'
  };

  let _cachedData = {};
  // expose the cache; useful for tests
  _this.cache = () => _cachedData;

  // Returns a Promise to fetch data
  // (resolved with the data if we have it already)
  _this.get = (which) => {
    if (_cachedData[which]) {
      return Promise.resolve(_cachedData[which]);
    }

    const file = _fileMap[which];
    const url = file && _this.asset(file);
    if (!url) {
      return Promise.reject(`Unknown data file for "${which}"`);
    }

    if (url.includes('{presets_version}')) {
      return _this.get('presets_package')
        .then(result => {
          const presetsVersion = result.version;
          return getUrl(url.replace('{presets_version}', presetsVersion), which);
        });
    } else {
      return getUrl(url);
    }
  };

  function getUrl(url, which) {
    let prom = _inflight[url];
    if (!prom) {
      _inflight[url] = prom = fetch(url)
        .then(response => {
          if (!response.ok || !response.json) {
            throw new Error(response.status + ' ' + response.statusText);
          }
          if (response.status === 204 || response.status === 205) return;  // No Content, Reset Content
          return response.json();
        })
        .then(result => {
          delete _inflight[url];
          if (!result) {
            throw new Error(`No data loaded for "${which}"`);
          }
          _cachedData[which] = result;
          return result;
        })
        .catch(err => {
          delete _inflight[url];
          throw err;
        });
    }

    return prom;
  }


  // Accessor for the file map
  _this.fileMap = function(val) {
    if (!arguments.length) return _fileMap;
    _fileMap = val;
    return _this;
  };

  let _assetPath = '';
  _this.assetPath = function(val) {
    if (!arguments.length) return _assetPath;
    _assetPath = val;
    return _this;
  };

  let _assetMap = {};
  _this.assetMap = function(val) {
    if (!arguments.length) return _assetMap;
    _assetMap = val;
    return _this;
  };

  _this.asset = (val) => {
    if (/^http(s)?:\/\//i.test(val)) return val;
    const filename = _assetPath + val;
    return _assetMap[filename] || filename;
  };

  return _this;
}

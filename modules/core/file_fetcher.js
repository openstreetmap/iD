import { utilFetchJson } from '../util/util';
import parseVersion from 'vparse';
// Double check this resolves to iD's `package.json`
import packageJSON from '../../package.json';

let _mainFileFetcher = coreFileFetcher(); // singleton

export { _mainFileFetcher as fileFetcher };

//
// coreFileFetcher asynchronously fetches data from JSON files
//
export function coreFileFetcher() {
  const ociVersion = packageJSON.dependencies['osm-community-index'] || packageJSON.devDependencies['osm-community-index'];
  const v = parseVersion(ociVersion);
  const vMinor = `${v.major}.${v.minor}`;

  let _this = {};
  let _inflight = {};
  let _fileMap = {
    'address_formats': 'data/address_formats.min.json',
    'deprecated': 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/deprecated.min.json',
    'discarded': 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/discarded.min.json',
    'imagery': 'data/imagery.min.json',
    'intro_graph': 'data/intro_graph.min.json',
    'keepRight': 'data/keepRight.min.json',
    'languages': 'data/languages.min.json',
    'locales': 'locales/index.min.json',
    'oci_defaults': `https://cdn.jsdelivr.net/npm/osm-community-index@${vMinor}/dist/defaults.min.json`,
    'oci_features': `https://cdn.jsdelivr.net/npm/osm-community-index@${vMinor}/dist/featureCollection.min.json`,
    'oci_resources': `https://cdn.jsdelivr.net/npm/osm-community-index@${vMinor}/dist/resources.min.json`,
    'preset_categories': 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/preset_categories.min.json',
    'preset_defaults': 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/preset_defaults.min.json',
    'preset_fields': 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/fields.min.json',
    'preset_presets': 'https://cdn.jsdelivr.net/npm/@openstreetmap/id-tagging-schema@3/dist/presets.min.json',
    'phone_formats': 'data/phone_formats.min.json',
    'qa_data': 'data/qa_data.min.json',
    'shortcuts': 'data/shortcuts.min.json',
    'territory_languages': 'data/territory_languages.min.json',
    'wmf_sitematrix': 'https://cdn.jsdelivr.net/npm/wmf-sitematrix@0.1/wikipedia.min.json'
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

    let prom = _inflight[url];
    if (!prom) {
      _inflight[url] = prom = utilFetchJson(url)
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
  };


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

import { json as d3_json } from 'd3-fetch';

let _mainFileFetcher = coreFileFetcher(); // singleton

export { _mainFileFetcher as fileFetcher };

//
// coreFileFetcher asynchronously fetches data from JSON files
//
export function coreFileFetcher() {
  let _this = {};
  let _inflight = {};
  let _fileMap = {
    'address_formats': 'data/address_formats.min.json',
    'deprecated': 'data/deprecated.min.json',
    'discarded': 'data/discarded.min.json',
    'imagery': 'data/imagery.min.json',
    'intro_graph': 'data/intro_graph.min.json',
    'keepRight': 'data/keepRight.min.json',
    'languages': 'data/languages.min.json',
    'locales': 'data/locales.min.json',
    'nsi_brands': 'https://cdn.jsdelivr.net/npm/name-suggestion-index@4/dist/brands.min.json',
    'nsi_filters': 'https://cdn.jsdelivr.net/npm/name-suggestion-index@4/dist/filters.min.json',
    'oci_features': 'https://cdn.jsdelivr.net/npm/osm-community-index@2/dist/features.min.json',
    'oci_resources': 'https://cdn.jsdelivr.net/npm/osm-community-index@2/dist/resources.min.json',
    'preset_categories': 'data/preset_categories.min.json',
    'preset_defaults': 'data/preset_defaults.min.json',
    'preset_fields': 'data/preset_fields.min.json',
    'preset_presets': 'data/preset_presets.min.json',
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
      _inflight[url] = prom = d3_json(url)
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

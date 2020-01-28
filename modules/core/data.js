import { json as d3_json } from 'd3-fetch';
import { data as _data } from '../../data';  // prebundled data


//
// The coreData module fetches data from JSON files
//
export function coreData(context) {
  let _module = {};
  let _inflight = {};
  let _fileMap = {
    'intro_graph': 'data/intro_graph.json'
  };


  // Returns a Promise to fetch data
  // (resolved with the data if we have it already)
  _module.get = (which) => {
    if (_data[which]) {
      return Promise.resolve(_data[which]);
    }

    const file = _fileMap[which];
    const url = file && context.asset(file);
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
          _data[which] = result;
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
  _module.fileMap = function(val) {
    if (!arguments.length) return _fileMap;
    _fileMap = val;
    return _module;
  };


  return _module;
}

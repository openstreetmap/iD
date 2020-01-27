import { json as d3_json } from 'd3-fetch';
import { data as _data } from '../../data';  // prebundled data


let _inflight = {};

const FILES = {
  'intro_graph': 'data/intro_graph.json'
};


export function coreData(context) {

  return {
    get: (which) => {
      if (_data[which]) {
        return Promise.resolve(_data[which]);
      }

      const file = FILES[which];
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
    }

  };
}

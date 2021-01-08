import LocationConflation from '@ideditor/location-conflation';
import whichPolygon from 'which-polygon';
import calcArea from '@mapbox/geojson-area';
import { utilArrayChunk } from '../util';

let _mainLocations = coreLocations(); // singleton
export { _mainLocations as locationManager };

//
// `coreLocations` maintains an internal index of all the boundaries/geofences used by iD.
// It's used by presets, community index, background imagery, to know where in the world these things are valid.
// These geofences should be defined by `locationSet` objects:
//
// let locationSet = {
//   include: [ Array of locations ],
//   exclude: [ Array of locations ]
// };
//
// For more info see the location-conflation and country-coder projects, see:
// https://github.com/ideditor/location-conflation
// https://github.com/ideditor/country-coder
//
export function coreLocations() {
  let _this = {};
  let _resolvedFeatures = {};                 // cache of *resolved* locationSet features
  let _loco = new LocationConflation();       // instance of a location-conflation resolver
  let _wp = whichPolygon({ features: [] });   // instance of a which-polygon index

  let _queue = [];
  let _deferred = new Set();
  let _inProcess;

  //
  // `mergeCustomGeoJSON`
  //  Accepts an FeatureCollection-like object containing custom locations
  //  Each feature must have a filename-like `id`, for example: `something.geojson`
  //
  //  {
  //    "type": "FeatureCollection"
  //    "features": [
  //      {
  //        "type": "Feature",
  //        "id": "philly_metro.geojson",
  //        "properties": { … },
  //        "geometry": { … }
  //      }
  //    ]
  //  }
  //
  _this.mergeCustomGeoJSON = (fc) => {
    if (fc && fc.type === 'FeatureCollection' && Array.isArray(fc.features)) {
      fc.features.forEach(feature => {
        feature.properties = feature.properties || {};
        let props = feature.properties;

        // Get `id` from either `id` or `properties`
        let id = feature.id || props.id;
        if (!id || !/^\S+\.geojson$/i.test(id)) return;

        // Ensure `id` exists and is lowercase
        id = id.toLowerCase();
        feature.id = id;
        props.id = id;

        // Ensure `area` property exists
        if (!props.area) {
          const area = calcArea.geometry(feature.geometry) / 1e6;  // m² to km²
          props.area = Number(area.toFixed(2));
        }

        _loco._cache[id] = feature;
      });
    }
  };


  //
  // `mergeLocationSets`
  //  Accepts an Array of locationSets to merge into the index
  //  Returns a Promise fullfilled when the resolving/indexing has been completed
  //  This will take some seconds but happen in the background during browser idle time
  //
  _this.mergeLocationSets = (locationSets) => {
    if (!Array.isArray(locationSets)) return Promise.reject('nothing to do');

    // Resolve all locationSets -> geojson, processing data in chunks
    //
    // Because this will happen during idle callbacks, we want to choose a chunk size
    // that won't make the browser stutter too badly.  LocationSets that are a simple
    // country coder include will resolve instantly, but ones that involve complex
    // include/exclude operations will take some milliseconds longer.
    //
    // Some discussion and performance results on these tickets:
    // https://github.com/ideditor/location-conflation/issues/26
    // https://github.com/osmlab/name-suggestion-index/issues/4784#issuecomment-742003434
    _queue = _queue.concat(utilArrayChunk(locationSets, 200));

    // Everything after here will be deferred.
    if (!_inProcess) {
      _inProcess = processQueue()
        .then(() => {  // rebuild the which-polygon index
          _wp = whichPolygon({ features: Object.values(_resolvedFeatures) });
          _inProcess = null;
        });
    }
    return _inProcess;


    function processQueue() {
      if (!_queue.length) return Promise.resolve();

      // console.log(`queue length ${_queue.length}`);
      const chunk = _queue.pop();
      return new Promise(resolvePromise => {
          const handle = window.requestIdleCallback(() => {
            _deferred.delete(handle);
            // const t0 = performance.now();
            chunk.forEach(resolveLocationSet);
            // const t1 = performance.now();
            // console.log('chunk processed in ' + (t1 - t0) + ' ms');
            resolvePromise();
          });
          _deferred.add(handle);
        })
        .then(() => processQueue());
    }


    function resolveLocationSet(locationSet) {
      try {
        const resolved = _loco.resolveLocationSet(locationSet);
        const locationSetID = resolved.id;
        if (!resolved.feature.geometry.coordinates.length || !resolved.feature.properties.area) {
          throw new Error(`locationSet ${locationSetID} resolves to an empty feature.`);
        }
        if (!_resolvedFeatures[locationSetID]) {  // First time seeing this locationSet feature
          let feature = JSON.parse(JSON.stringify(resolved.feature));   // deep clone
          feature.id = locationSetID;      // Important: always use the locationSet `id` (`+[Q30]`), not the feature `id` (`Q30`)
          feature.properties.id = locationSetID;
          _resolvedFeatures[locationSetID] = feature;  // insert into cache
        }
      } catch (err) { /* ignore? */ }
    }
  };


  //
  // `locationSetID`
  // Return a locationSetID for a given locationSet (fallback to the 'world')
  //
  _this.locationSetID = (locationSet) => {
    let locationSetID;
    try {
      locationSetID = _loco.validateLocationSet(locationSet).id;
    } catch (err) {
      locationSetID = '+[Q2]';  // the world
    }
    return locationSetID;
  };


  //
  // `feature`
  // Return the GeoJSON feature for a given locationSetID (fallback to 'world')
  //
  _this.feature = (locationSetID) => _resolvedFeatures[locationSetID] || _resolvedFeatures['+[Q2]'];


  //
  // `query`
  // Execute a query directly against which-polygon
  // https://github.com/mapbox/which-polygon
  // Arguments
  //   `loc`: the [lon,lat] location to query,
  //   `multi`= true to return all results, `false` to return first result
  // Returns
  //   Array of GeoJSON *properties* for the locationSet features that exist at `loc`
  //
  _this.query = (loc, multi) => _wp(loc, multi);

  //
  // `locationsHere`
  // Convenience method to find all the locationSets valid at the given location.
  // Arguments
  //   `loc`: the [lon,lat] location to query
  // Returns
  //   A result Object of ids to areas
  //  {
  //    "+[Q2]": 511207893.3958111,
  //    "+[Q30]": 21817019.17,
  //    "+[new_jersey.geojson]": 22390.77,
  //    …
  //  }
  //
  _this.locationsAt = (loc) => {
    let result = {};
    _wp(loc, true).forEach(prop => result[prop.id] = prop.area);
    return result;
  };

  // Direct access to the location-conflation resolver
  _this.loco = () => _loco;

  // Direct access to the which-polygon index
  _this.wp = () => _wp;


  return _this;
}

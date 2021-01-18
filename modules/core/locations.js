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
  let _resolvedFeatures = {};              // cache of *resolved* locationSet features
  let _loco = new LocationConflation();    // instance of a location-conflation resolver
  let _wp;                                 // instance of a which-polygon index

  // pre-resolve the worldwide locationSet
  const world = { locationSet: { include: ['Q2'] } };
  resolveLocationSet(world);
  rebuildIndex();

  let _queue = [];
  let _deferred = new Set();
  let _inProcess;


  // Returns a Promise to process the queue
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

  // Pass an Object with a `locationSet` property,
  // Performs the locationSet resolution, caches the result, and sets a `locationSetID` property on the object.
  function resolveLocationSet(obj) {
    if (obj.locationSetID) return;  // work was done already

    try {
      const locationSet = obj.locationSet;
      if (!locationSet) {
        throw new Error('object missing locationSet property');
      }
      const resolved = _loco.resolveLocationSet(locationSet);
      const locationSetID = resolved.id;
      obj.locationSetID = locationSetID;

      if (!resolved.feature.geometry.coordinates.length || !resolved.feature.properties.area) {
        throw new Error(`locationSet ${locationSetID} resolves to an empty feature.`);
      }
      if (!_resolvedFeatures[locationSetID]) {  // First time seeing this locationSet feature
        let feature = JSON.parse(JSON.stringify(resolved.feature));   // deep clone
        feature.id = locationSetID;      // Important: always use the locationSet `id` (`+[Q30]`), not the feature `id` (`Q30`)
        feature.properties.id = locationSetID;
        _resolvedFeatures[locationSetID] = feature;  // insert into cache
      }
    } catch (err) {
      obj.locationSet = { include: ['Q2'] };  // default worldwide
      obj.locationSetID = '+[Q2]';
    }
  }

  // Rebuilds the whichPolygon index with whatever features have been resolved.
  function rebuildIndex() {
    _wp = whichPolygon({ features: Object.values(_resolvedFeatures) });
  }

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
  //  Accepts an Array of Objects containing `locationSet` properties.
  //  The locationSets will be resolved and indexed in the background.
  //  [
  //   { id: 'preset1', locationSet: {…} },
  //   { id: 'preset2', locationSet: {…} },
  //   { id: 'preset3', locationSet: {…} },
  //   …
  //  ]
  //  After resolving and indexing, the Objects will be decorated with a
  //  `locationSetID` property.
  //  [
  //   { id: 'preset1', locationSet: {…}, locationSetID: '+[Q2]' },
  //   { id: 'preset2', locationSet: {…}, locationSetID: '+[Q30]' },
  //   { id: 'preset3', locationSet: {…}, locationSetID: '+[Q2]' },
  //   …
  //  ]
  //
  //  Returns a Promise fullfilled when the resolving/indexing has been completed
  //  This will take some seconds but happen in the background during browser idle time.
  //
  _this.mergeLocationSets = (objects) => {
    if (!Array.isArray(objects)) return Promise.reject('nothing to do');

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
    _queue = _queue.concat(utilArrayChunk(objects, 200));

    if (!_inProcess) {
      _inProcess = processQueue()
        .then(() => {
          rebuildIndex();
          _inProcess = null;
          return objects;
        });
    }
    return _inProcess;
  };


  //
  // `locationSetID`
  // Returns a locationSetID for a given locationSet (fallback to `+[Q2]`, world)
  // (The locationset doesn't necessarily need to be resolved to compute its `id`)
  //
  // Arguments
  //   `locationSet`: A locationSet, e.g. `{ include: ['us'] }`
  // Returns
  //   The locationSetID, e.g. `+[Q30]`
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
  // Returns the resolved GeoJSON feature for a given locationSetID (fallback to 'world')
  //
  // Arguments
  //   `locationSetID`: id of the form like `+[Q30]`  (United States)
  // Returns
  //   A GeoJSON feature:
  //   {
  //     type: 'Feature',
  //     id: '+[Q30]',
  //     properties: { id: '+[Q30]', area: 21817019.17, … },
  //     geometry: { … }
  //   }
  _this.feature = (locationSetID) => _resolvedFeatures[locationSetID] || _resolvedFeatures['+[Q2]'];


  //
  // `locationsAt`
  // Find all the resolved locationSets valid at the given location.
  // Results include the area (in km²) to facilitate sorting.
  //
  // Arguments
  //   `loc`: the [lon,lat] location to query, e.g. `[-74.4813, 40.7967]`
  // Returns
  //   Object of locationSetIDs to areas (in km²)
  //   {
  //     "+[Q2]": 511207893.3958111,
  //     "+[Q30]": 21817019.17,
  //     "+[new_jersey.geojson]": 22390.77,
  //     …
  //   }
  //
  _this.locationsAt = (loc) => {
    let result = {};
    _wp(loc, true).forEach(prop => result[prop.id] = prop.area);
    return result;
  };

  //
  // `query`
  // Execute a query directly against which-polygon
  // https://github.com/mapbox/which-polygon
  //
  // Arguments
  //   `loc`: the [lon,lat] location to query,
  //   `multi`: `true` to return all results, `false` to return first result
  // Returns
  //   Array of GeoJSON *properties* for the locationSet features that exist at `loc`
  //
  _this.query = (loc, multi) => _wp(loc, multi);

  // Direct access to the location-conflation resolver
  _this.loco = () => _loco;

  // Direct access to the which-polygon index
  _this.wp = () => _wp;


  return _this;
}

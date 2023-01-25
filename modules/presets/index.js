import { dispatch as d3_dispatch } from 'd3-dispatch';

import { prefs } from '../core/preferences';
import { fileFetcher } from '../core/file_fetcher';
import { locationManager } from '../core/LocationManager';

import { osmNodeGeometriesForTags, osmSetAreaKeys, osmSetLineTags, osmSetPointTags, osmSetVertexTags } from '../osm/tags';
import { presetCategory } from './category';
import { presetCollection } from './collection';
import { presetField } from './field';
import { presetPreset } from './preset';
import { utilArrayUniq, utilRebind } from '../util';

export { presetCategory };
export { presetCollection };
export { presetField };
export { presetPreset };

let _mainPresetIndex = presetIndex(); // singleton
export { _mainPresetIndex as presetManager };

//
// `presetIndex` wraps a `presetCollection`
// with methods for loading new data and returning defaults
//
export function presetIndex() {
  const dispatch = d3_dispatch('favoritePreset', 'recentsChange');
  const MAXRECENTS = 30;

  // seed the preset lists with geometry fallbacks
  const POINT = presetPreset('point', { name: 'Point', tags: {}, geometry: ['point', 'vertex'], matchScore: 0.1 } );
  const LINE = presetPreset('line', { name: 'Line', tags: {}, geometry: ['line'], matchScore: 0.1 } );
  const AREA = presetPreset('area', { name: 'Area', tags: { area: 'yes' }, geometry: ['area'], matchScore: 0.1 } );
  const RELATION = presetPreset('relation', { name: 'Relation', tags: {}, geometry: ['relation'], matchScore: 0.1 } );

  let _this = presetCollection([POINT, LINE, AREA, RELATION]);
  let _presets = { point: POINT, line: LINE, area: AREA, relation: RELATION };

  let _defaults = {
    point: presetCollection([POINT]),
    vertex: presetCollection([POINT]),
    line: presetCollection([LINE]),
    area: presetCollection([AREA]),
    relation: presetCollection([RELATION])
  };

  let _fields = {};
  let _categories = {};
  let _universal = [];
  let _addablePresetIDs = null;   // Set of preset IDs that the user can add
  let _recents;
  let _favorites;

  // Index of presets by (geometry, tag key).
  let _geometryIndex = { point: {}, vertex: {}, line: {}, area: {}, relation: {} };
  let _loadPromise;


  _this.ensureLoaded = () => {
    if (_loadPromise) return _loadPromise;

    return _loadPromise = Promise.all([
        fileFetcher.get('preset_categories'),
        fileFetcher.get('preset_defaults'),
        fileFetcher.get('preset_presets'),
        fileFetcher.get('preset_fields')
      ])
      .then(vals => {
        _this.merge({
          categories: vals[0],
          defaults: vals[1],
          presets: vals[2],
          fields: vals[3]
        });
        osmSetAreaKeys(_this.areaKeys());
        osmSetLineTags(_this.lineTags());
        osmSetPointTags(_this.pointTags());
        osmSetVertexTags(_this.vertexTags());
      });
  };


  // `merge` accepts an object containing new preset data (all properties optional):
  // {
  //   fields: {},
  //   presets: {},
  //   categories: {},
  //   defaults: {},
  //   featureCollection: {}
  //}
  _this.merge = (d) => {
    let newLocationSets = [];

    // Merge Fields
    if (d.fields) {
      Object.keys(d.fields).forEach(fieldID => {
        let f = d.fields[fieldID];

        if (f) {   // add or replace
          f = presetField(fieldID, f, _fields);
          if (f.locationSet) newLocationSets.push(f);
          _fields[fieldID] = f;

        } else {   // remove
          delete _fields[fieldID];
        }
      });
    }

    // Merge Presets
    if (d.presets) {
      Object.keys(d.presets).forEach(presetID => {
        let p = d.presets[presetID];

        if (p) {   // add or replace
          const isAddable = !_addablePresetIDs || _addablePresetIDs.has(presetID);
          p = presetPreset(presetID, p, isAddable, _fields, _presets);
          if (p.locationSet) newLocationSets.push(p);
          _presets[presetID] = p;

        } else {   // remove (but not if it's a fallback)
          const existing = _presets[presetID];
          if (existing && !existing.isFallback()) {
            delete _presets[presetID];
          }
        }
      });
    }

    // Merge Categories
    if (d.categories) {
      Object.keys(d.categories).forEach(categoryID => {
        let c = d.categories[categoryID];

        if (c) {   // add or replace
          c = presetCategory(categoryID, c, _presets);
          if (c.locationSet) newLocationSets.push(c);
          _categories[categoryID] = c;

        } else {   // remove
          delete _categories[categoryID];
        }
      });
    }

    // Rebuild _this.collection after changing presets and categories
    _this.collection = Object.values(_presets).concat(Object.values(_categories));

    // Merge Defaults
    if (d.defaults) {
      Object.keys(d.defaults).forEach(geometry => {
        const def = d.defaults[geometry];
        if (Array.isArray(def)) {   // add or replace
          _defaults[geometry] = presetCollection(
            def.map(id => _presets[id] || _categories[id]).filter(Boolean)
          );
        } else {   // remove
          delete _defaults[geometry];
        }
      });
    }

    // Rebuild universal fields array
    _universal = Object.values(_fields).filter(field => field.universal);

    // Reset all the preset fields - they'll need to be resolved again
    Object.values(_presets).forEach(preset => preset.resetFields());

    // Rebuild geometry index
    _geometryIndex = { point: {}, vertex: {}, line: {}, area: {}, relation: {} };
    _this.collection.forEach(preset => {
      (preset.geometry || []).forEach(geometry => {
        let g = _geometryIndex[geometry];
        for (let key in preset.tags) {
          g[key] = g[key] || {};
          let value = preset.tags[key];
          (g[key][value] = g[key][value] || []).push(preset);
        }
      });
    });

    // Merge Custom Features
    if (d.featureCollection && Array.isArray(d.featureCollection.features)) {
      locationManager.mergeCustomGeoJSON(d.featureCollection);
    }

    // Resolve all locationSet features.
    if (newLocationSets.length) {
      locationManager.mergeLocationSets(newLocationSets);
    }

    return _this;
  };


  _this.match = (entity, resolver) => {
    return resolver.transient(entity, 'presetMatch', () => {
      let geometry = entity.geometry(resolver);
      // Treat entities on addr:interpolation lines as points, not vertices - #3241
      if (geometry === 'vertex' && entity.isOnAddressLine(resolver)) {
        geometry = 'point';
      }
      const entityExtent = entity.extent(resolver);
      return _this.matchTags(entity.tags, geometry, entityExtent.center());
    });
  };


  _this.matchTags = (tags, geometry, loc) => {
    const keyIndex = _geometryIndex[geometry];
    let bestScore = -1;
    let bestMatch;
    let matchCandidates = [];

    for (let k in tags) {
      let indexMatches = [];

      let valueIndex = keyIndex[k];
      if (!valueIndex) continue;

      let keyValueMatches = valueIndex[tags[k]];
      if (keyValueMatches) indexMatches.push(...keyValueMatches);
      let keyStarMatches = valueIndex['*'];
      if (keyStarMatches) indexMatches.push(...keyStarMatches);

      if (indexMatches.length === 0) continue;

      for (let i = 0; i < indexMatches.length; i++) {
        const candidate = indexMatches[i];
        const score = candidate.matchScore(tags);

        if (score === -1){
          continue;
        }
        matchCandidates.push({score, candidate});

        if (score > bestScore) {
          bestScore = score;
          bestMatch = candidate;
        }
      }
    }

    if (bestMatch && bestMatch.locationSetID && bestMatch.locationSetID !== '+[Q2]' && Array.isArray(loc)){
      const validHere = locationManager.locationSetsAt(loc);
      if (!validHere[bestMatch.locationSetID]) {
        matchCandidates.sort((a, b) => (a.score < b.score) ? 1 : -1);
        for (let i = 0; i < matchCandidates.length; i++) {
          const candidateScore = matchCandidates[i];
          if (!candidateScore.candidate.locationSetID || validHere[candidateScore.candidate.locationSetID]) {
            bestMatch = candidateScore.candidate;
            bestScore = candidateScore.score;
            break;
          }
        }
      }
    }

    // If any part of an address is present, allow fallback to "Address" preset - #4353
    if (!bestMatch || bestMatch.isFallback()) {
      for (let k in tags){
          if (/^addr:/.test(k) && keyIndex['addr:*'] && keyIndex['addr:*']['*']) {
            bestMatch = keyIndex['addr:*']['*'][0];
            break;
          }
      }
    }

    return bestMatch || _this.fallback(geometry);
  };

  _this.allowsVertex = (entity, resolver) => {
    if (entity.type !== 'node') return false;
    if (Object.keys(entity.tags).length === 0) return true;

    return resolver.transient(entity, 'vertexMatch', () => {
      // address lines allow vertices to act as standalone points
      if (entity.isOnAddressLine(resolver)) return true;

      const geometries = osmNodeGeometriesForTags(entity.tags);
      if (geometries.vertex) return true;
      if (geometries.point) return false;
      // allow vertices for unspecified points
      return true;
    });
  };


  // Because of the open nature of tagging, iD will never have a complete
  // list of tags used in OSM, so we want it to have logic like "assume
  // that a closed way with an amenity tag is an area, unless the amenity
  // is one of these specific types". This function computes a structure
  // that allows testing of such conditions, based on the presets designated
  // as as supporting (or not supporting) the area geometry.
  //
  // The returned object L is a keeplist/discardlist of tags. A closed way
  // with a tag (k, v) is considered to be an area if `k in L && !(v in L[k])`
  // (see `Way#isArea()`). In other words, the keys of L form the keeplist,
  // and the subkeys form the discardlist.
  _this.areaKeys = () => {
    // The ignore list is for keys that imply lines. (We always add `area=yes` for exceptions)
    const ignore = {
      barrier: true,
      highway: true,
      footway: true,
      railway: true,
      junction: true,
      traffic_calming: true,
      type: true
    };
    let areaKeys = {};

    // ignore name-suggestion-index and deprecated presets
    const presets = _this.collection.filter(p => !p.suggestion && !p.replacement);

    // keeplist
    presets.forEach(p => {
      const keys = p.tags && Object.keys(p.tags);
      const key = keys && keys.length && keys[0];  // pick the first tag
      if (!key) return;
      if (ignore[key]) return;

      if (p.geometry.indexOf('area') !== -1) {    // probably an area..
        areaKeys[key] = areaKeys[key] || {};
      }
    });

    // discardlist
    presets.forEach(p => {
      let key;
      for (key in p.addTags) {
        // examine all addTags to get a better sense of what can be tagged on lines - #6800
        const value = p.addTags[key];
        if (key in areaKeys &&                    // probably an area...
          p.geometry.indexOf('line') !== -1 &&    // but sometimes a line
          value !== '*') {
          areaKeys[key][value] = true;
        }
      }
    });

    return areaKeys;
  };


  _this.lineTags = () => {
    return _this.collection.filter((lineTags, d) => {
      // ignore name-suggestion-index, deprecated, and generic presets
      if (d.suggestion || d.replacement || d.searchable === false) return lineTags;

      // only care about the primary tag
      const keys = d.tags && Object.keys(d.tags);
      const key = keys && keys.length && keys[0];  // pick the first tag
      if (!key) return lineTags;

      // if this can be a line
      if (d.geometry.indexOf('line') !== -1) {
        lineTags[key] = lineTags[key] || [];
        lineTags[key].push(d.tags);
      }
      return lineTags;
    }, {});
  };


  _this.pointTags = () => {
    return _this.collection.reduce((pointTags, d) => {
      // ignore name-suggestion-index, deprecated, and generic presets
      if (d.suggestion || d.replacement || d.searchable === false) return pointTags;

      // only care about the primary tag
      const keys = d.tags && Object.keys(d.tags);
      const key = keys && keys.length && keys[0];  // pick the first tag
      if (!key) return pointTags;

      // if this can be a point
      if (d.geometry.indexOf('point') !== -1) {
        pointTags[key] = pointTags[key] || {};
        pointTags[key][d.tags[key]] = true;
      }
      return pointTags;
    }, {});
  };


  _this.vertexTags = () => {
    return _this.collection.reduce((vertexTags, d) => {
      // ignore name-suggestion-index, deprecated, and generic presets
      if (d.suggestion || d.replacement || d.searchable === false) return vertexTags;

      // only care about the primary tag
      const keys = d.tags && Object.keys(d.tags);
      const key = keys && keys.length && keys[0];  // pick the first tag
      if (!key) return vertexTags;

      // if this can be a vertex
      if (d.geometry.indexOf('vertex') !== -1) {
        vertexTags[key] = vertexTags[key] || {};
        vertexTags[key][d.tags[key]] = true;
      }
      return vertexTags;
    }, {});
  };


  _this.field = (id) => _fields[id];

  _this.universal = () => _universal;


  _this.defaults = (geometry, n, startWithRecents, loc, extraPresets) => {
    let recents = [];
    if (startWithRecents) {
      recents = _this.recent().matchGeometry(geometry).collection.slice(0, 4);
    }

    let defaults;
    if (_addablePresetIDs) {
      defaults = Array.from(_addablePresetIDs).map(function(id) {
        var preset = _this.item(id);
        if (preset && preset.matchGeometry(geometry)) return preset;
        return null;
      }).filter(Boolean);
    } else {
      defaults = _defaults[geometry].collection.concat(_this.fallback(geometry));
    }

    let result = presetCollection(
      utilArrayUniq(recents.concat(defaults).concat(extraPresets || [])).slice(0, n - 1)
    );

    if (Array.isArray(loc)) {
      const validHere = locationManager.locationSetsAt(loc);
      result.collection = result.collection.filter(a => !a.locationSetID || validHere[a.locationSetID]);
    }

    return result;
  };

  // pass a Set of addable preset ids
  _this.addablePresetIDs = function(val) {
    if (!arguments.length) return _addablePresetIDs;

    // accept and convert arrays
    if (Array.isArray(val)) val = new Set(val);

    _addablePresetIDs = val;
    if (_addablePresetIDs) {   // reset all presets
      _this.collection.forEach(p => {
        // categories aren't addable
        if (p.addable) p.addable(_addablePresetIDs.has(p.id));
      });
    } else {
      _this.collection.forEach(p => {
        if (p.addable) p.addable(true);
      });
    }

    return _this;
  };


  _this.recent = () => {
    return presetCollection(
      utilArrayUniq(_this.getRecents()
        .map(d => d.preset)
        .filter(d => d.searchable !== false))
    );
  };


  function RibbonItem(preset, source) {
    let item = {};
    item.preset = preset;
    item.source = source;

    item.isFavorite = () => item.source === 'favorite';
    item.isRecent = () => item.source === 'recent';
    item.matches = (preset) => item.preset.id === preset.id;
    item.minified = () => ({ pID: item.preset.id });

    return item;
  }


  function ribbonItemForMinified(d, source) {
    if (d && d.pID) {
      const preset = _this.item(d.pID);
      if (!preset) return null;
      return RibbonItem(preset, source);
    }
    return null;
  }


  _this.getGenericRibbonItems = () => {
    return ['point', 'line', 'area'].map(id => RibbonItem(_this.item(id), 'generic'));
  };


  _this.getAddable = () => {
      if (!_addablePresetIDs) return [];

      return _addablePresetIDs.map((id) => {
        const preset = _this.item(id);
        if (preset) return RibbonItem(preset, 'addable');
        return null;
      }).filter(Boolean);
  };


  function setRecents(items) {
    _recents = items;
    const minifiedItems = items.map(d => d.minified());
    prefs('preset_recents', JSON.stringify(minifiedItems));
    dispatch.call('recentsChange');
  }


  _this.getRecents = () => {
    if (!_recents) {
      // fetch from local storage
      _recents = (JSON.parse(prefs('preset_recents')) || [])
        .reduce((acc, d) => {
          let item = ribbonItemForMinified(d, 'recent');
          if (item && item.preset.addable()) acc.push(item);
          return acc;
        }, []);
    }
    return _recents;
  };


  _this.addRecent = (preset, besidePreset, after) => {
    const recents = _this.getRecents();

    const beforeItem = _this.recentMatching(besidePreset);
    let toIndex = recents.indexOf(beforeItem);
    if (after) toIndex += 1;

    const newItem = RibbonItem(preset, 'recent');
    recents.splice(toIndex, 0, newItem);
    setRecents(recents);
  };


  _this.removeRecent = (preset) => {
    const item = _this.recentMatching(preset);
    if (item) {
      let items = _this.getRecents();
      items.splice(items.indexOf(item), 1);
      setRecents(items);
    }
  };


  _this.recentMatching = (preset) => {
    const items = _this.getRecents();
    for (let i in items) {
      if (items[i].matches(preset)) {
        return items[i];
      }
    }
    return null;
  };


  _this.moveItem = (items, fromIndex, toIndex) => {
    if (fromIndex === toIndex ||
      fromIndex < 0 || toIndex < 0 ||
      fromIndex >= items.length || toIndex >= items.length
    ) return null;

    items.splice(toIndex, 0, items.splice(fromIndex, 1)[0]);
    return items;
  };


  _this.moveRecent = (item, beforeItem) => {
    const recents = _this.getRecents();
    const fromIndex = recents.indexOf(item);
    const toIndex = recents.indexOf(beforeItem);
    const items = _this.moveItem(recents, fromIndex, toIndex);
    if (items) setRecents(items);
  };


  _this.setMostRecent = (preset) => {
    if (preset.searchable === false) return;

    let items = _this.getRecents();
    let item = _this.recentMatching(preset);
    if (item) {
      items.splice(items.indexOf(item), 1);
    } else {
      item = RibbonItem(preset, 'recent');
    }

    // remove the last recent (first in, first out)
    while (items.length >= MAXRECENTS) {
      items.pop();
    }

    // prepend array
    items.unshift(item);
    setRecents(items);
  };

  function setFavorites(items) {
    _favorites = items;
    const minifiedItems = items.map(d => d.minified());
    prefs('preset_favorites', JSON.stringify(minifiedItems));

    // call update
    dispatch.call('favoritePreset');
  }

  _this.addFavorite = (preset, besidePreset, after) => {
      const favorites = _this.getFavorites();

      const beforeItem = _this.favoriteMatching(besidePreset);
      let toIndex = favorites.indexOf(beforeItem);
      if (after) toIndex += 1;

      const newItem = RibbonItem(preset, 'favorite');
      favorites.splice(toIndex, 0, newItem);
      setFavorites(favorites);
  };

  _this.toggleFavorite = (preset) => {
    const favs = _this.getFavorites();
    const favorite = _this.favoriteMatching(preset);
    if (favorite) {
      favs.splice(favs.indexOf(favorite), 1);
    } else {
      // only allow 10 favorites
      if (favs.length === 10) {
          // remove the last favorite (last in, first out)
          favs.pop();
      }
      // append array
      favs.push(RibbonItem(preset, 'favorite'));
    }
    setFavorites(favs);
  };


  _this.removeFavorite = (preset) => {
    const item = _this.favoriteMatching(preset);
    if (item) {
      const items = _this.getFavorites();
      items.splice(items.indexOf(item), 1);
      setFavorites(items);
    }
  };


  _this.getFavorites = () => {
    if (!_favorites) {

      // fetch from local storage
      let rawFavorites = JSON.parse(prefs('preset_favorites'));

      if (!rawFavorites) {
        rawFavorites = [];
        prefs('preset_favorites', JSON.stringify(rawFavorites));
      }

      _favorites = rawFavorites.reduce((output, d) => {
        const item = ribbonItemForMinified(d, 'favorite');
        if (item && item.preset.addable()) output.push(item);
        return output;
      }, []);
    }
    return _favorites;
  };


  _this.favoriteMatching = (preset) => {
    const favs = _this.getFavorites();
    for (let index in favs) {
      if (favs[index].matches(preset)) {
        return favs[index];
      }
    }
    return null;
  };


  return utilRebind(_this, dispatch, 'on');
}

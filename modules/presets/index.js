import { dispatch as d3_dispatch } from 'd3-dispatch';
import { json as d3_json } from 'd3-fetch';

import { data } from '../../data/index';
import { osmNodeGeometriesForTags } from '../osm/tags';
import { presetCategory } from './category';
import { presetCollection } from './collection';
import { presetField } from './field';
import { presetPreset } from './preset';
import { utilArrayUniq, utilRebind } from '../util';

export { presetCategory };
export { presetCollection };
export { presetField };
export { presetPreset };


// wraps a presetCollection with methods for
// loading new data and returning defaults
export function presetIndex(context) {
  const dispatch = d3_dispatch('recentsChange');
  const MAXRECENTS = 30;
  let _presetData;

  let _this = presetCollection([]);  // collection of all presets
  let _defaults = {
    point: presetCollection([]),
    vertex: presetCollection([]),
    line: presetCollection([]),
    area: presetCollection([]),
    relation: presetCollection([])
  };

  let _fields = {};
  let _universal = [];
  let _recents;
  // let _addablePresetIDs;    // presets that the user can add

  // Index of presets by (geometry, tag key).
  let _index = { point: {}, vertex: {}, line: {}, area: {}, relation: {} };


  function ensurePresetData() {
    const data = context.data();
    return Promise.all([
        data.get('preset_categories'),
        data.get('preset_defaults'),
        data.get('preset_presets'),
        data.get('preset_fields')
      ])
      .then(vals => {
        if (_presetData) return _presetData;

        return _presetData = {
          categories: vals[0],
          defaults: vals[1],
          presets: vals[2],
          fields: vals[3]
        };
      });
  }


  // _this.init = (addablePresetIDs) => {
  _this.init = () => {
    // _addablePresetIDs = addablePresetIDs;
    _this.collection = [];
    _recents = null;
    _fields = {};
    _universal = [];
    _index = { point: {}, vertex: {}, line: {}, area: {}, relation: {} };

    // let addable = true;
    // if (addablePresetIDs) {
    //   addable = (presetID) => addablePresetIDs.indexOf(presetID) !== -1;
    // }
    // return _this.build(d, addable);

    return ensurePresetData()
      .then(d => _this.build(d));
  };


  _this.reset = () => {
    _defaults = {
      point: presetCollection([]),
      vertex: presetCollection([]),
      line: presetCollection([]),
      area: presetCollection([]),
      relation: presetCollection([])
    };

    _this.collection = [];
    _recents = null;
    _fields = {};
    _universal = [];
    _index = { point: {}, vertex: {}, line: {}, area: {}, relation: {} };

    return _this;
  };


  // _this.fromExternal = (external, done) => {
  //   _this.reset();
  //   d3_json(external)
  //     .then(externalPresets => {
  //       _this.build(data.presets, false);    // load the default presets as non-addable to start
  //       _addablePresetIDs = externalPresets.presets && Object.keys(externalPresets.presets);
  //       _this.build(externalPresets, true);  // then load the external presets as addable
  //     })
  //     .catch(() => _this.init())
  //     .finally(() => done(_this));
  // };

  // _this.build = (d, addable) => {
  _this.build = (d) => {
    if (d.fields && Object.keys(d.fields).length) {
      Object.keys(d.fields).forEach(fieldID => {
        const f = d.fields[fieldID];
        _fields[fieldID] = presetField(fieldID, f);
        if (f.universal) {
          _universal.push(_fields[fieldID]);
        }
      });
    }

    if (d.presets && Object.keys(d.presets).length) {
      const rawPresets = d.presets;
      Object.keys(d.presets).forEach(presetID => {
        const p = d.presets[presetID];
        const existing = _this.index(presetID);
        // const isAddable = typeof addable === 'function' ? addable(presetID, p) : addable;
        const isAddable = true;
        if (existing !== -1) {
          _this.collection[existing] = presetPreset(presetID, p, _fields, isAddable, rawPresets);
        } else {
          _this.collection.push(presetPreset(presetID, p, _fields, isAddable, rawPresets));
        }
      });
    }

    if (d.categories && Object.keys(d.categories).length) {
      Object.keys(d.categories).forEach(categoryID => {
        const c = d.categories[categoryID];
        const existing = _this.index(categoryID);
        if (existing !== -1) {
          _this.collection[existing] = presetCategory(categoryID, c, _this);
        } else {
          _this.collection.push(presetCategory(categoryID, c, _this));
        }
      });
    }

    const getItem = (_this.item).bind(_this);
    // if (_addablePresetIDs) {
    //   ['area', 'line', 'point', 'vertex', 'relation'].forEach(geometry => {
    //     _defaults[geometry] = presetCollection(
    //       _addablePresetIDs.map(getItem).filter(preset => preset.geometry.indexOf(geometry) !== -1)
    //     );
    //   });
    // } else if (d.defaults) {
    if (d.defaults && Object.keys(d.defaults).length) {
      _defaults = {
        point: presetCollection(d.defaults.point.map(getItem)),
        vertex: presetCollection(d.defaults.vertex.map(getItem)),
        line: presetCollection(d.defaults.line.map(getItem)),
        area: presetCollection(d.defaults.area.map(getItem)),
        relation: presetCollection(d.defaults.relation.map(getItem))
      };
    }

    for (let i = 0; i < _this.collection.length; i++) {
      const preset = _this.collection[i];
      const geometry = preset.geometry;

      for (let j = 0; j < geometry.length; j++) {
        let g = _index[geometry[j]];
        for (let k in preset.tags) {
          (g[k] = g[k] || []).push(preset);
        }
      }
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
      return _this.matchTags(entity.tags, geometry);
    });
  };


  _this.matchTags = (tags, geometry) => {
    const geometryMatches = _index[geometry];
    let address;
    let best = -1;
    let match;

    for (let k in tags) {
      // If any part of an address is present, allow fallback to "Address" preset - #4353
      if (/^addr:/.test(k) && geometryMatches['addr:*']) {
        address = geometryMatches['addr:*'][0];
      }

      const keyMatches = geometryMatches[k];
      if (!keyMatches) continue;

      for (let i = 0; i < keyMatches.length; i++) {
        const score = keyMatches[i].matchScore(tags);
        if (score > best) {
          best = score;
          match = keyMatches[i];
        }
      }
    }

    if (address && (!match || match.isFallback())) {
      match = address;
    }
    return match || _this.fallback(geometry);
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
    const ignore = ['barrier', 'highway', 'footway', 'railway', 'junction', 'type'];
    let areaKeys = {};

    // ignore name-suggestion-index and deprecated presets
    const presets = _this.collection.filter(p => !p.suggestion && !p.replacement);

    // keeplist
    presets.forEach(p => {
      let key;
      for (key in p.tags) break;  // pick the first tag
      if (!key) return;
      if (ignore.indexOf(key) !== -1) return;

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


  _this.pointTags = () => {
    return _this.collection.reduce((pointTags, d) => {
      // ignore name-suggestion-index, deprecated, and generic presets
      if (d.suggestion || d.replacement || d.searchable === false) return pointTags;

      // only care about the primary tag
      let key;
      for (key in d.tags) break;  // pick the first tag
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
      let key;
      for (key in d.tags) break;   // pick the first tag
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


  _this.defaults = (geometry, n) => {
    let rec = [];
    if (!context.inIntro()) {
      rec = _this.recent().matchGeometry(geometry).collection.slice(0, 4);
    }
    const def = utilArrayUniq(rec.concat(_defaults[geometry].collection)).slice(0, n - 1);
    return presetCollection(
      utilArrayUniq(rec.concat(def).concat(_this.fallback(geometry)))
    );
  };


  _this.recent = () => {
    return presetCollection(
      utilArrayUniq(_this.getRecents().map(d => d.preset))
    );
  };


  function RibbonItem(preset, geometry, source) {
    let item = {};
    item.preset = preset;
    item.geometry = geometry;
    item.source = source;

    item.isRecent = () => item.source === 'recent';
    item.matches = (preset, geometry) => item.preset.id === preset.id && item.geometry === geometry;
    item.minified = () => ({ pID: item.preset.id, geom: item.geometry });

    return item;
  }


  function ribbonItemForMinified(d, source) {
    if (d && d.pID && d.geom) {
      const preset = _this.item(d.pID);
      if (!preset) return null;

      let geom = d.geom;
      // treat point and vertex features as one geometry
      if (geom === 'vertex') geom = 'point';

      // iD's presets could have changed since this was saved,
      // so make sure it's still valid.
      if (preset.matchGeometry(geom) || (geom === 'point' && preset.matchGeometry('vertex'))) {
        return RibbonItem(preset, geom, source);
      }
    }
    return null;
  }


  function setRecents(items) {
    _recents = items;
    const minifiedItems = items.map(d => d.minified());
    context.storage('preset_recents', JSON.stringify(minifiedItems));
    dispatch.call('recentsChange');
  }


  _this.getRecents = () => {
    if (!_recents) {
      // fetch from local storage
      _recents = (JSON.parse(context.storage('preset_recents')) || [])
        .reduce((acc, d) => {
          let item = ribbonItemForMinified(d, 'recent');
          if (item && item.preset.addable()) acc.push(item);
          return acc;
        }, []);
    }
    return _recents;
  };


  _this.removeRecent = (preset, geometry) => {
    const item = _this.recentMatching(preset, geometry);
    if (item) {
      let items = _this.getRecents();
      items.splice(items.indexOf(item), 1);
      setRecents(items);
    }
  };


  _this.recentMatching = (preset, geometry) => {
    geometry = _this.fallback(geometry).id;
    const items = _this.getRecents();
    for (let i in items) {
      if (items[i].matches(preset, geometry)) {
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


  _this.setMostRecent = (preset, geometry) => {
    if (context.inIntro()) return;
    if (preset.searchable === false) return;

    geometry = _this.fallback(geometry).id;

    let items = _this.getRecents();
    let item = _this.recentMatching(preset, geometry);
    if (item) {
      items.splice(items.indexOf(item), 1);
    } else {
      item = RibbonItem(preset, geometry, 'recent');
    }

    // remove the last recent (first in, first out)
    while (items.length >= MAXRECENTS) {
      items.pop();
    }

    // prepend array
    items.unshift(item);
    setRecents(items);
  };

  return utilRebind(_this, dispatch, 'on');
}

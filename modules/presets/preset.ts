import type { Geometry, Preset } from '@openstreetmap/id-tagging-schema';
import { localizer, t } from '../core/localizer';
import { osmAreaKeys, osmAreaKeysExceptions } from '../osm/tags';
import { utilObjectOmit } from '../util';
import { utilSafeClassName, utilStripDiacritics } from '../util/util';
import { locationManager } from '../core/location_manager';
import type { presetField } from './field';
import type { Vec2 } from '../geo/vector';

export interface presetPreset extends Omit<Preset,
  | 'fields'
  | 'moreFields'
  | 'matchScore'
  | 'addTags'
  | 'removeTags'
  | 'name'
  | 'aliases'
  | 'terms'
  | 'reference'
> {
  id: string;
  safeid: string;
  originalTerms: string[];
  originalName: string;
  originalAliases: string[];
  originalScore: number;
  originalReference: Partial<NonNullable<Preset['reference']>>;
  originalFields: string[];
  originalMoreFields: string[];
  fields(loc?: Vec2): presetField[];
  moreFields(loc?: Vec2): presetField[];
  locationSetID?: string;
  matchGeometry(geometry: Geometry): boolean;
  matchAllGeometry(geometries: Geometry[]): boolean;
  matchScore(entityTags: Tags): number;
  setTags(tags: Tags, geometry: Geometry, skipFieldDefaults?: boolean, loc?: Vec2): Tags;
  unsetTags(tags: Tags, geometry: Geometry, ignoringKeys?: string[], skipFieldDefaults?: boolean, loc?: Vec2): Tags;
  t: presetField['t'];
  t_all: typeof localizer.t_all;
  addTags: Tags;
  removeTags: Tags;
  name(): string;
  nameLabel(): d3.Selector;
  subtitle(): string | undefined | null;
  subtitleLabel(): d3.Selector | null;
  suggestion?: boolean;
  aliases(): string[];
  terms(): string[];
  reference(): { key: string; value?: string } | { qid: string };
  searchName(): string;
  searchNameStripped(): string;
  searchAliases(): string[];
  searchAliasesStripped(): string[];
  isFallback(): boolean;
  getParentPreset(): presetPreset | undefined;
  addable: GetSet<presetPreset, boolean>;
}

//
// `presetPreset` decorates a given `preset` Object
// with some extra methods for searching and matching geometry
//
export function presetPreset(
  presetID: string,
  preset: Preset,
  addable?: boolean,
  allFields: Record<string, presetField> = {},
  allPresets: Record<string, presetPreset> = {},
) {
  allFields = allFields || {};
  allPresets = allPresets || {};
  let _this = <presetPreset>(<unknown>Object.assign({}, preset)); // shallow copy
  let _addable = addable || false;
  let _searchName: string;            // cache
  let _searchNameStripped: string;    // cache
  let _searchAliases: string[];         // cache
  let _searchAliasesStripped: string[]; // cache

  _this.id = presetID;

  _this.safeid = utilSafeClassName(presetID);  // for use in css classes, selectors, element ids

  _this.originalTerms = preset.terms || [];

  _this.originalName = preset.name || '';

  _this.originalAliases = preset.aliases || [];

  _this.originalScore = preset.matchScore || 1;

  _this.originalReference = preset.reference || {};

  _this.originalFields = (preset.fields || []);

  _this.originalMoreFields = (preset.moreFields || []);

  _this.fields = loc => resolveFields('fields', loc);

  _this.moreFields = loc => resolveFields('moreFields', loc);

  _this.tags = _this.tags || {};

  _this.addTags = _this.addTags || _this.tags;

  _this.removeTags = _this.removeTags || _this.addTags;

  _this.geometry = (_this.geometry || []);

  _this.matchGeometry = (geom) => _this.geometry.indexOf(geom) >= 0;

  _this.matchAllGeometry = (geoms) => geoms.every(_this.matchGeometry);

  _this.matchScore = (entityTags) => {
    const tags = _this.tags;
    let seen: Record<TagKey, true> = {};
    let score = 0;

    // match on tags
    for (let k in tags) {
      seen[k] = true;
      if (entityTags[k] === tags[k]) {
        score += _this.originalScore;
      } else if (tags[k] === '*' && k in entityTags) {
        score += _this.originalScore / 2;
      } else {
        return -1;
      }
    }

    // boost score for additional matches in addTags - #6802
    const addTags = _this.addTags;
    for (let k in addTags) {
      if (!seen[k] && entityTags[k] === addTags[k]) {
        score += _this.originalScore;
      }
    }

    if (_this.searchable === false) {
      score *= 0.999;
    }

    return score;
  };

  const _t: presetPreset['t'] = (scope, options) => {
    const textID = `_tagging.presets.presets.${presetID}.${scope}`;
    return t(textID, options);
  };

  _this.t_all = (scope, options) => {
    const textID = `_tagging.presets.presets.${presetID}.${scope}`;
    return localizer.t_all(textID, options);
  };

  _t.append = (scope, options) => {
    const textID = `_tagging.presets.presets.${presetID}.${scope}`;
    return t.append(textID, options);
  };
  _this.t = _t;

  _this.name = () => {
    return _this
      .t('name', { 'default': _this.originalName || presetID });
  };

  _this.nameLabel = () => {
    return _this
      .t.append('name', { 'default': _this.originalName || presetID });
  };

  _this.subtitle = () => {
      if (_this.suggestion) {
        let path = presetID.split('/');
        path.pop();  // remove brand name
        const basePreset = allPresets[path.join('/')];
        return basePreset?.name();
      }
      return null;
  };

  _this.subtitleLabel = () => {
      if (_this.suggestion) {
        let path = presetID.split('/');
        path.pop();  // remove brand name
        const basePreset = allPresets[path.join('/')];
        return basePreset?.nameLabel();
      }
      return null;
  };

  _this.aliases = () => {
    return _this
        .t_all('aliases', { 'default': _this.originalAliases });
  };

  _this.terms = () => {
    return _this
        .t_all('terms', { 'default': _this.originalTerms });
  };

  _this.searchName = () => {
    if (!_searchName) {
      _searchName = (_this.suggestion ? _this.originalName : _this.name()).toLowerCase();
    }
    return _searchName;
  };

  _this.searchNameStripped = () => {
    if (!_searchNameStripped) {
      _searchNameStripped = utilStripDiacritics(_this.searchName());
    }
    return _searchNameStripped;
  };

  _this.searchAliases = () => {
    if (!_searchAliases) {
      _searchAliases = _this.aliases().map(alias => alias.toLowerCase());
    }
    return _searchAliases;
  };

  _this.searchAliasesStripped = () => {
    if (!_searchAliasesStripped) {
      _searchAliasesStripped = _this.searchAliases();
      _searchAliasesStripped = _searchAliasesStripped.map(utilStripDiacritics);
    }
    return _searchAliasesStripped;
  };

  _this.isFallback = () => {
    const tagCount = Object.keys(_this.tags).length;
    return tagCount === 0 || (tagCount === 1 && _this.tags.hasOwnProperty('area'));
  };


  _this.addable = function(val) {
    if (!arguments.length) return _addable;
    _addable = val;
    return _this;
  } as presetPreset['addable'];


  _this.reference = () => {
    // Lookup documentation on Wikidata...
    const qid = (
      _this.tags.wikidata ||
      _this.tags['flag:wikidata'] ||
      _this.tags['brand:wikidata'] ||
      _this.tags['network:wikidata'] ||
      _this.tags['operator:wikidata']
    );
    if (qid) {
      return { qid: qid };
    }

    // Lookup documentation on OSM Wikibase...
    let key = _this.originalReference.key || Object.keys(utilObjectOmit(_this.tags, ['name']))[0];
    let value = _this.originalReference.value || _this.tags[key];

    if (value === '*') {
      return { key: key };
    } else {
      return { key: key, value: value };
    }
  };


  _this.unsetTags = (tags, geometry, ignoringKeys, skipFieldDefaults, loc) => {
    // allow manually keeping some tags
    let removeTags = ignoringKeys ? utilObjectOmit(_this.removeTags, ignoringKeys) : _this.removeTags;
    tags = utilObjectOmit(tags, Object.keys(removeTags));

    if (geometry && !skipFieldDefaults) {
      _this.fields(loc).forEach(field => {
        if (field.matchGeometry(geometry) && field.key &&
            field.default === tags[field.key] &&
            (!ignoringKeys || ignoringKeys.indexOf(field.key) === -1)) {
          delete tags[field.key];
        }
      });
    }

    delete tags.area;
    return tags;
  };


  _this.setTags = (tags, geometry, skipFieldDefaults, loc) => {
    const addTags = _this.addTags;
    tags = Object.assign({}, tags);   // shallow copy

    for (let k in addTags) {
      if (addTags[k] === '*') {
        // if this tag is ancillary, don't override an existing value since any value is okay
        if (_this.tags[k] || !tags[k]) {
          tags[k] = 'yes';
        }
      } else {
        tags[k] = addTags[k];
      }
    }

    // Add area=yes if necessary.
    // This is necessary if the geometry is already an area (e.g. user drew an area) AND any of:
    // 1. chosen preset could be either an area or a line (`barrier=city_wall`)
    // 2. chosen preset doesn't have a key in osmAreaKeys (`railway=station`),
    //    and is not an "exceptional area" tag (e.g. `waterway=dam`)
    if (!addTags.hasOwnProperty('area')) {
      delete tags.area;
      if (geometry === 'area') {
        let needsAreaTag = true;
        for (let k in addTags) {
          if (_this.geometry.indexOf('line') === -1 && k in osmAreaKeys
              || k in osmAreaKeysExceptions && addTags[k] in osmAreaKeysExceptions[k]) {
            needsAreaTag = false;
            break;
          }
        }
        if (needsAreaTag) {
          tags.area = 'yes';
        }
      }
    }

    if (geometry && !skipFieldDefaults) {
      _this.fields(loc).forEach(field => {
        if (field.matchGeometry(geometry) && field.key && !tags[field.key] && field.default) {
          tags[field.key] = field.default;
        }
      });
    }

    return tags;
  };


  _this.getParentPreset = function() {
    return allPresets[_this.id.split('/').slice(0, -1).join('/')];
  };


  // For a preset without fields, use the fields of the parent preset.
  // Replace {preset} placeholders with the fields of the specified presets.
  function resolveFields(which: 'fields' | 'moreFields', loc?: Vec2) {
    const fieldIDs = (which === 'fields' ? _this.originalFields : _this.originalMoreFields);
    let resolved = fieldIDs.map(fieldID => allFields[fieldID]);

    if (loc) {
      const validHere = locationManager.locationSetsAt(loc);
      resolved = resolved.filter(field => !field.locationSetID || validHere.has(field.locationSetID));
    }

    return resolved;
  }

  return _this;
}

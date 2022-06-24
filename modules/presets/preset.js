import { t } from '../core/localizer';
import { osmAreaKeys, osmAreaKeysExceptions } from '../osm/tags';
import { utilArrayUniq, utilObjectOmit } from '../util';
import { utilSafeClassName } from '../util/util';


//
// `presetPreset` decorates a given `preset` Object
// with some extra methods for searching and matching geometry
//
export function presetPreset(presetID, preset, addable, allFields, allPresets) {
  allFields = allFields || {};
  allPresets = allPresets || {};
  let _this = Object.assign({}, preset);   // shallow copy
  let _addable = addable || false;
  let _resolvedFields;      // cache
  let _resolvedMoreFields;  // cache
  let _searchName; // cache
  let _searchNameStripped; // cache
  let _searchAliases; // cache
  let _searchAliasesStripped; // cache

  _this.id = presetID;

  _this.safeid = utilSafeClassName(presetID);  // for use in css classes, selectors, element ids

  _this.originalTerms = (_this.terms || []).join();

  _this.originalName = _this.name || '';

  _this.originalAliases = (_this.aliases || []).join('\n');

  _this.originalScore = _this.matchScore || 1;

  _this.originalReference = _this.reference || {};

  _this.originalFields = (_this.fields || []);

  _this.originalMoreFields = (_this.moreFields || []);

  _this.fields = () => _resolvedFields || (_resolvedFields = resolve('fields'));

  _this.moreFields = () => _resolvedMoreFields || (_resolvedMoreFields = resolve('moreFields'));

  _this.resetFields = () => _resolvedFields = _resolvedMoreFields = null;

  _this.tags = _this.tags || {};

  _this.addTags = _this.addTags || _this.tags;

  _this.removeTags = _this.removeTags || _this.addTags;

  _this.geometry = (_this.geometry || []);

  _this.matchGeometry = (geom) => _this.geometry.indexOf(geom) >= 0;

  _this.matchAllGeometry = (geoms) => geoms.every(_this.matchGeometry);

  _this.matchScore = (entityTags) => {
    const tags = _this.tags;
    let seen = {};
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


  _this.t = (scope, options) => {
    const textID = `_tagging.presets.presets.${presetID}.${scope}`;
    return t(textID, options);
  };

  _this.t.append = (scope, options) => {
    const textID = `_tagging.presets.presets.${presetID}.${scope}`;
    return t.append(textID, options);
  };


  _this.name = () => {
    return _this.t('name', { 'default': _this.originalName });
  };

  _this.nameLabel = () => _this.t.append('name', { 'default': _this.originalName });

  _this.subtitle = () => {
      if (_this.suggestion) {
        let path = presetID.split('/');
        path.pop();  // remove brand name
        return t('_tagging.presets.presets.' + path.join('/') + '.name');
      }
      return null;
  };

  _this.subtitleLabel = () => {
      if (_this.suggestion) {
        let path = presetID.split('/');
        path.pop();  // remove brand name
        return t.append('_tagging.presets.presets.' + path.join('/') + '.name');
      }
      return null;
  };

  _this.aliases = () => {
    return _this.t('aliases', { 'default': _this.originalAliases }).trim().split(/\s*[\r\n]+\s*/);
  };

  _this.terms = () => _this.t('terms', { 'default': _this.originalTerms })
    .toLowerCase().trim().split(/\s*,+\s*/);

  _this.searchName = () => {
    if (!_searchName) {
      _searchName = (_this.suggestion ? _this.originalName : _this.name()).toLowerCase();
    }
    return _searchName;
  };

  _this.searchNameStripped = () => {
    if (!_searchNameStripped) {
      _searchNameStripped = stripDiacritics(_this.searchName());
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
      _searchAliasesStripped = _searchAliasesStripped.map(stripDiacritics);
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
  };


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
    let key = _this.originalReference.key || Object.keys(utilObjectOmit(_this.tags, 'name'))[0];
    let value = _this.originalReference.value || _this.tags[key];

    if (value === '*') {
      return { key: key };
    } else {
      return { key: key, value: value };
    }
  };


  _this.unsetTags = (tags, geometry, ignoringKeys, skipFieldDefaults) => {
    // allow manually keeping some tags
    let removeTags = ignoringKeys ? utilObjectOmit(_this.removeTags, ignoringKeys) : _this.removeTags;
    tags = utilObjectOmit(tags, Object.keys(removeTags));

    if (geometry && !skipFieldDefaults) {
      _this.fields().forEach(field => {
        if (field.matchGeometry(geometry) && field.key && field.default === tags[field.key]) {
          delete tags[field.key];
        }
      });
    }

    delete tags.area;
    return tags;
  };


  _this.setTags = (tags, geometry, skipFieldDefaults) => {
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
      _this.fields().forEach(field => {
        if (field.matchGeometry(geometry) && field.key && !tags[field.key] && field.default) {
          tags[field.key] = field.default;
        }
      });
    }

    return tags;
  };


  // For a preset without fields, use the fields of the parent preset.
  // Replace {preset} placeholders with the fields of the specified presets.
  function resolve(which) {
    const fieldIDs = (which === 'fields' ? _this.originalFields : _this.originalMoreFields);
    let resolved = [];

    fieldIDs.forEach(fieldID => {
      const match = fieldID.match(/\{(.*)\}/);
      if (match !== null) {    // a presetID wrapped in braces {}
        resolved = resolved.concat(inheritFields(match[1], which));
      } else if (allFields[fieldID]) {    // a normal fieldID
        resolved.push(allFields[fieldID]);
      } else {
        console.log(`Cannot resolve "${fieldID}" found in ${_this.id}.${which}`);  // eslint-disable-line no-console
      }
    });

    // no fields resolved, so use the parent's if possible
    if (!resolved.length) {
      const endIndex = _this.id.lastIndexOf('/');
      const parentID = endIndex && _this.id.substring(0, endIndex);
      if (parentID) {
        resolved = inheritFields(parentID, which);
      }
    }

    return utilArrayUniq(resolved);


    // returns an array of fields to inherit from the given presetID, if found
    function inheritFields(presetID, which) {
      const parent = allPresets[presetID];
      if (!parent) return [];

      if (which === 'fields') {
        return parent.fields().filter(shouldInherit);
      } else if (which === 'moreFields') {
        return parent.moreFields();
      } else {
        return [];
      }
    }


    // Skip `fields` for the keys which define the preset.
    // These are usually `typeCombo` fields like `shop=*`
    function shouldInherit(f) {
      if (f.key && _this.tags[f.key] !== undefined &&
        // inherit anyway if multiple values are allowed or just a checkbox
        f.type !== 'multiCombo' && f.type !== 'semiCombo' && f.type !== 'manyCombo' && f.type !== 'check'
      ) return false;

      return true;
    }
  }


  function stripDiacritics(s) {
    // split combined diacritical characters into their parts
    if (s.normalize) s = s.normalize('NFD');
    // remove diacritics
    s = s.replace(/[\u0300-\u036f]/g, '');
    return s;
  }

  return _this;
}

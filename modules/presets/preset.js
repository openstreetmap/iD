import { t } from '../util/locale';
import { osmAreaKeys } from '../osm/tags';
import { utilArrayUniq, utilObjectOmit } from '../util';
import { utilSafeClassName } from '../util/util';


//
// `presetPreset` decorates a given `preset` Object
// with some extra methods for searching and matching geometry
//
export function presetPreset(presetID, preset, allFields, addable, rawPresets) {
  let _this = Object.assign({}, preset);   // shallow copy
  let _addable = addable || false;

  _this.id = presetID;

  _this.safeid = utilSafeClassName(presetID);  // for use in css classes, selectors, element ids

  _this.originalTerms = (_this.terms || []).join();

  _this.originalName = _this.name || '';

  _this.originalScore = _this.matchScore || 1;

  _this.originalReference = _this.reference || {};

  _this.fields = (_this.fields || []).map(f => allFields[f]);

  _this.moreFields = (_this.moreFields || []).map(f => allFields[f]);

  if (rawPresets) {
    resolveFieldInheritance();
  }

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

    return score;
  };


  let _textCache = {};
  _this.t = (scope, options) => {
    const textID = `presets.presets.${presetID}.${scope}`;
    if (_textCache[textID]) return _textCache[textID];
    return _textCache[textID] = t(textID, options);
  };


  _this.name = () => {
    if (_this.suggestion) {
      let path = presetID.split('/');
      path.pop();  // remove brand name
      // NOTE: insert an en-dash, not a hypen (to avoid conflict with fr - nl names in Brussels etc)
      return _this.originalName + ' – ' + t('presets.presets.' + path.join('/') + '.name');
    }
    return _this.t('name', { 'default': _this.originalName });
  };


  _this.terms = () => _this.t('terms', { 'default': _this.originalTerms })
    .toLowerCase().trim().split(/\s*,+\s*/);


  _this.isFallback = () => {
    const tagCount = Object.keys(_this.tags).length;
    return tagCount === 0 || (tagCount === 1 && _this.tags.hasOwnProperty('area'));
  };


  _this.addable = function(val) {
    if (!arguments.length) return _addable;
    _addable = val;
    return _this;
  };


  _this.reference = (geom) => {
    // Lookup documentation on Wikidata...
    const qid = _this.tags.wikidata || _this.tags['brand:wikidata'] || _this.tags['operator:wikidata'];
    if (qid) {
      return { qid: qid };
    }

    // Lookup documentation on OSM Wikibase...
    let key = _this.originalReference.key || Object.keys(utilObjectOmit(_this.tags, 'name'))[0];
    let value = _this.originalReference.value || _this.tags[key];

    if (geom === 'relation' && key === 'type') {
      if (value in _this.tags) {
        key = value;
        value = _this.tags[key];
      } else {
        return { rtype: value };
      }
    }

    if (value === '*') {
      return { key: key };
    } else {
      return { key: key, value: value };
    }
  };


  _this.unsetTags = (tags, geometry, skipFieldDefaults) => {
    tags = utilObjectOmit(tags, Object.keys(_this.removeTags));

    if (geometry && !skipFieldDefaults) {
      _this.fields.forEach(field => {
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
        tags[k] = 'yes';
      } else {
        tags[k] = addTags[k];
      }
    }

    // Add area=yes if necessary.
    // This is necessary if the geometry is already an area (e.g. user drew an area) AND any of:
    // 1. chosen preset could be either an area or a line (`barrier=city_wall`)
    // 2. chosen preset doesn't have a key in osmAreaKeys (`railway=station`)
    if (!addTags.hasOwnProperty('area')) {
      delete tags.area;
      if (geometry === 'area') {
        let needsAreaTag = true;
        if (_this.geometry.indexOf('line') === -1) {
          for (let k in addTags) {
            if (k in osmAreaKeys) {
              needsAreaTag = false;
              break;
            }
          }
        }
        if (needsAreaTag) {
          tags.area = 'yes';
        }
      }
    }

    if (geometry && !skipFieldDefaults) {
      _this.fields.forEach(field => {
        if (field.matchGeometry(geometry) && field.key && !tags[field.key] && field.default) {
          tags[field.key] = field.default;
        }
      });
    }

    return tags;
  };


  // For a preset without fields, use the fields of the parent preset.
  // Replace {preset} placeholders with the fields of the specified presets.
  function resolveFieldInheritance() {

    ['fields', 'moreFields'].forEach(prop => {
      let fieldIDs = [];
      if (preset[prop] && preset[prop].length) {    // fields were defined
        preset[prop].forEach(fieldID => {
          const match = fieldID.match(/\{(.*)\}/);
          if (match !== null) {        // presetID wrapped in braces {}
            const inheritIDs = inheritedFieldIDs(match[1], prop);
            if (inheritIDs !== null) {
              fieldIDs = fieldIDs.concat(inheritIDs);
            } else {
              /* eslint-disable no-console */
              console.log(`Cannot resolve presetID ${match[0]} found in ${_this.id} ${prop}`);
              /* eslint-enable no-console */
            }
          } else {
            fieldIDs.push(fieldID);  // no braces - just a normal field
          }
        });

      } else {  // no fields defined, so use the parent's if possible
        const endIndex = _this.id.lastIndexOf('/');
        const parentID = endIndex && _this.id.substring(0, endIndex);
        if (parentID) {
          fieldIDs = inheritedFieldIDs(parentID, prop);
        }
      }

      fieldIDs = utilArrayUniq(fieldIDs);
      preset[prop] = fieldIDs;
      rawPresets[_this.id][prop] = fieldIDs;
    });

    // Skip `fields` for the keys which define the _this.
    // These are usually `typeCombo` fields like `shop=*`
    function shouldInheritFieldWithID(fieldID) {
      const f = allFields[fieldID];
      if (f.key) {
        if (_this.tags[f.key] !== undefined &&
          // inherit anyway if multiple values are allowed or just a checkbox
          f.type !== 'multiCombo' && f.type !== 'semiCombo' && f.type !== 'check'
        ) return false;
      }
      return true;
    }

    // returns an array of field IDs to inherit from the given presetID, if found
    function inheritedFieldIDs(presetID, prop) {
      if (!presetID) return null;

      const inheritPreset = rawPresets[presetID];
      if (!inheritPreset) return null;

      let inheritFieldIDs = inheritPreset[prop] || [];
      if (prop === 'fields') {
        inheritFieldIDs = inheritFieldIDs.filter(shouldInheritFieldWithID);
      }

      return inheritFieldIDs;
    }
  }


  return _this;
}

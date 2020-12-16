import { utilArrayIntersection, utilArrayUniq } from '../util/array';
import { utilEditDistance } from '../util';


//
// `presetCollection` is a wrapper around an `Array` of presets `collection`,
// and decorated with some extra methods for searching and matching geometry
//
export function presetCollection(collection) {
  const MAXRESULTS = 50;
  let _this = {};
  let _memo = {};

  _this.collection = collection;

  _this.item = (id) => {
    if (_memo[id]) return _memo[id];
    const found = _this.collection.find(d => d.id === id);
    if (found) _memo[id] = found;
    return found;
  };

  _this.index = (id) => _this.collection.findIndex(d => d.id === id);

  _this.matchGeometry = (geometry) => {
    return presetCollection(
      _this.collection.filter(d => d.matchGeometry(geometry))
    );
  };

  _this.matchAllGeometry = (geometries) => {
    return presetCollection(
      _this.collection.filter(d => d && d.matchAllGeometry(geometries))
    );
  };

  _this.matchAnyGeometry = (geometries) => {
    return presetCollection(
      _this.collection.filter(d => geometries.some(geom => d.matchGeometry(geom)))
    );
  };

  _this.fallback = (geometry) => {
    let id = geometry;
    if (id === 'vertex') id = 'point';
    return _this.item(id);
  };

  _this.search = (value, geometry, countryCodes) => {
    if (!value) return _this;

    value = value.toLowerCase().trim();
    // split combined diacritical characters into their parts
    if (value.normalize) value = value.normalize('NFD');
    // remove diacritics
    value = value.replace(/[\u0300-\u036f]/g, '');

    // match at name beginning or just after a space (e.g. "office" -> match "Law Office")
    function leading(a) {
      const index = a.indexOf(value);
      return index === 0 || a[index - 1] === ' ';
    }

    // match at name beginning only
    function leadingStrict(a) {
      const index = a.indexOf(value);
      return index === 0;
    }

    function sortNames(a, b) {
      let aCompare = a.searchName();
      let bCompare = b.searchName();

      // priority if search string matches preset name exactly - #4325
      if (value === aCompare) return -1;
      if (value === bCompare) return 1;

      // priority for higher matchScore
      let i = b.originalScore - a.originalScore;
      if (i !== 0) return i;

      // priority if search string appears earlier in preset name
      i = aCompare.indexOf(value) - bCompare.indexOf(value);
      if (i !== 0) return i;

      // priority for shorter preset names
      return aCompare.length - bCompare.length;
    }

    let pool = _this.collection;
    if (countryCodes) {
      if (typeof countryCodes === 'string') countryCodes = [countryCodes];
      countryCodes = countryCodes.map(code => code.toLowerCase());

      pool = pool.filter(a => {
        if (a.locationSet) {
          if (a.locationSet.include && !utilArrayIntersection(a.locationSet.include, countryCodes).length) return false;
          if (a.locationSet.exclude && utilArrayIntersection(a.locationSet.exclude, countryCodes).length) return false;
        }
        return true;
      });
    }
    const searchable = pool.filter(a => a.searchable !== false && a.suggestion !== true);
    const suggestions = pool.filter(a => a.suggestion === true);

    // matches value to preset.name
    const leadingName = searchable
      .filter(a => leading(a.searchName()))
      .sort(sortNames);

    // matches value to preset suggestion name
    const leadingSuggestions = suggestions
      .filter(a => leadingStrict(a.searchName()))
      .sort(sortNames);

    // matches value to preset.terms values
    const leadingTerms = searchable
      .filter(a => (a.terms() || []).some(leading));

    // matches value to preset.tags values
    const leadingTagValues = searchable
      .filter(a => Object.values(a.tags || {}).filter(val => val !== '*').some(leading));

    // finds close matches to value in preset.name
    const similarName = searchable
      .map(a => ({ preset: a, dist: utilEditDistance(value, a.searchName()) }))
      .filter(a => a.dist + Math.min(value.length - a.preset.searchName().length, 0) < 3)
      .sort((a, b) => a.dist - b.dist)
      .map(a => a.preset);

    // finds close matches to value to preset suggestion name
    const similarSuggestions = suggestions
      .map(a => ({ preset: a, dist: utilEditDistance(value, a.searchName()) }))
      .filter(a => a.dist + Math.min(value.length - a.preset.searchName().length, 0) < 1)
      .sort((a, b) => a.dist - b.dist)
      .map(a => a.preset);

    // finds close matches to value in preset.terms
    const similarTerms = searchable
      .filter(a => {
        return (a.terms() || []).some(b => {
          return utilEditDistance(value, b) + Math.min(value.length - b.length, 0) < 3;
        });
      });

    let results = leadingName.concat(
      leadingSuggestions,
      leadingTerms,
      leadingTagValues,
      similarName,
      similarSuggestions,
      similarTerms
    ).slice(0, MAXRESULTS - 1);

    if (geometry) {
      if (typeof geometry === 'string') {
        results.push(_this.fallback(geometry));
      } else {
        geometry.forEach(geom => results.push(_this.fallback(geom)));
      }
    }

    return presetCollection(utilArrayUniq(results));
  };


  return _this;
}

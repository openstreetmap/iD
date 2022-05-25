import { locationManager } from '../core/locations';
import { utilArrayUniq } from '../util/array';
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

  _this.search = (value, geometry, loc) => {
    if (!value) return _this;

    // don't remove diacritical characters since we're assuming the user is being intentional
    value = value.toLowerCase().trim();

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

    function sortPresets(nameProp, aliasesProp) {
      return function sortNames(a, b) {
        let aCompare = a[nameProp]();
        let bCompare = b[nameProp]();
        if (aliasesProp) {
          // also search in aliases
          const findMatchingAlias = strings => {
            if (strings.some(s => s === value)) {
              return strings.find(s => s === value);
            } else {
              return strings.find(s => s.includes(value));
            }
          };
          aCompare = findMatchingAlias([aCompare].concat(a[aliasesProp]()));
          bCompare = findMatchingAlias([bCompare].concat(b[aliasesProp]()));
        }

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
      };
    }

    let pool = _this.collection;
    if (Array.isArray(loc)) {
      const validLocations = locationManager.locationsAt(loc);
      pool = pool.filter(a => !a.locationSetID || validLocations[a.locationSetID]);
    }

    const searchable = pool.filter(a => a.searchable !== false && a.suggestion !== true);
    const suggestions = pool.filter(a => a.suggestion === true);

    // matches value to preset.name
    const leadingNames = searchable
      .filter(a => leading(a.searchName()) || a.searchAliases().some(leading))
      .sort(sortPresets('searchName', 'searchAliases'));

    // matches value to preset suggestion name
    const leadingSuggestions = suggestions
      .filter(a => leadingStrict(a.searchName()))
      .sort(sortPresets('searchName'));

    const leadingNamesStripped = searchable
      .filter(a => leading(a.searchNameStripped()) || a.searchAliasesStripped().some(leading))
      .sort(sortPresets('searchNameStripped', 'searchAliasesStripped'));

    const leadingSuggestionsStripped = suggestions
      .filter(a => leadingStrict(a.searchNameStripped()))
      .sort(sortPresets('searchNameStripped'));

    // matches value to preset.terms values
    const leadingTerms = searchable
      .filter(a => (a.terms() || []).some(leading));

    const leadingSuggestionTerms = suggestions
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

    // matches key=value to preset.tags
    let leadingTagKeyValues = [];
    if (value.includes('=')) {
      leadingTagKeyValues = searchable.filter(a => a.tags &&
          Object.keys(a.tags).some(key => key + '=' + a.tags[key] === value))
        .concat(searchable.filter(a => a.tags &&
          Object.keys(a.tags).some(key => leading(key + '=' + a.tags[key]))));
    }

    let results = leadingNames.concat(
      leadingSuggestions,
      leadingNamesStripped,
      leadingSuggestionsStripped,
      leadingTerms,
      leadingSuggestionTerms,
      leadingTagValues,
      similarName,
      similarSuggestions,
      similarTerms,
      leadingTagKeyValues
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

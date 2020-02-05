import { utilArrayUniq, utilEditDistance } from '../util';


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

  _this.search = (value, geometry, countryCode) => {
    if (!value) return _this;

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

    function sortNames(a, b) {
      let aCompare = (a.suggestion ? a.originalName : a.name()).toLowerCase();
      let bCompare = (b.suggestion ? b.originalName : b.name()).toLowerCase();

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
    if (countryCode) {
      pool = pool.filter(a => {
        if (a.countryCodes && a.countryCodes.indexOf(countryCode) === -1) return false;
        if (a.notCountryCodes && a.notCountryCodes.indexOf(countryCode) !== -1) return false;
        return true;
      });
    }
    const searchable = pool.filter(a => a.searchable !== false && a.suggestion !== true);
    const suggestions = pool.filter(a => a.suggestion === true);

    // matches value to preset.name
    const leading_name = searchable
      .filter(a => leading(a.name().toLowerCase()))
      .sort(sortNames);

    // matches value to preset suggestion name (original name is unhyphenated)
    const leading_suggestions = suggestions
      .filter(a => leadingStrict(a.originalName.toLowerCase()))
      .sort(sortNames);

    // matches value to preset.terms values
    const leading_terms = searchable
      .filter(a => (a.terms() || []).some(leading));

    // matches value to preset.tags values
    const leading_tag_values = searchable
      .filter(a => Object.values(a.tags || {}).filter(val => val !== '*').some(leading));

    // finds close matches to value in preset.name
    const similar_name = searchable
      .map(a => ({ preset: a, dist: utilEditDistance(value, a.name()) }))
      .filter(a => a.dist + Math.min(value.length - a.preset.name().length, 0) < 3)
      .sort((a, b) => a.dist - b.dist)
      .map(a => a.preset);

    // finds close matches to value to preset suggestion name (original name is unhyphenated)
    const similar_suggestions = suggestions
      .map(a => ({ preset: a, dist: utilEditDistance(value, a.originalName.toLowerCase()) }))
      .filter(a => a.dist + Math.min(value.length - a.preset.originalName.length, 0) < 1)
      .sort((a, b) => a.dist - b.dist)
      .map(a => a.preset);

    // finds close matches to value in preset.terms
    const similar_terms = searchable
      .filter(a => {
        return (a.terms() || []).some(b => {
          return utilEditDistance(value, b) + Math.min(value.length - b.length, 0) < 3;
        });
      });

    let results = leading_name.concat(
      leading_suggestions,
      leading_terms,
      leading_tag_values,
      similar_name,
      similar_suggestions,
      similar_terms
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

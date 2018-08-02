import _isMatch from 'lodash-es/isMatch';
import _reduce from 'lodash-es/reduce';

export function utilMapCSSRule(selector, areaKeys) {
    var ruleChecks  = {
        equals: function (tags) {
            return _isMatch(tags, selector.equals);
        },
        notEquals: function (tags) {
            return !_isMatch(tags, selector.notEquals);
        },
        absence: function(tags) {
            return Object.keys(tags).indexOf(selector.absence) === -1;
        },
        presence: function(tags) {
            return Object.keys(tags).indexOf(selector.presence) > -1;
        },
        greaterThan: function(tags) {
            var key = Object.keys(selector.greaterThan)[0];
            var value = selector.greaterThan[key];
            return tags[key] > value;
        },
        greaterThanEqual: function(tags) {
            var key = Object.keys(selector.greaterThanEqual)[0];
            var value = selector.greaterThanEqual[key];
            return tags[key] >= value;
        },
        lessThan: function(tags) {
            var key = Object.keys(selector.lessThan)[0];
            var value = selector.lessThan[key];
            return tags[key] < value;
        },
        lessThanEqual: function(tags) {
            var key = Object.keys(selector.lessThanEqual)[0];
            var value = selector.lessThanEqual[key];
            return tags[key] <= value; 
        },
        positiveRegex: function(tags) {
            var tagKey = Object.keys(selector.positiveRegex)[0];
            var expression = selector.positiveRegex[tagKey].join('|');
            var regex = new RegExp(expression);
            return regex.test(tags[tagKey]);
        },
        negativeRegex: function(tags) {
            var tagKey = Object.keys(selector.negativeRegex)[0];
            var expression = selector.negativeRegex[tagKey].join('|');
            var regex = new RegExp(expression);
            return !regex.test(tags[tagKey]);
        }
    };

    var rule = {
        ruleChecks: ruleChecks,
        type: Object.keys(selector).indexOf('error') > -1 ? 'error' : 'warning',
        buildChecks: function() {
            return Object.keys(selector)
                .filter(function(key) { return key !== 'geometry' && key !== 'error' && key !== 'warning'; })
                .map(function(key) { return ruleChecks[key]; });

        },
        matches: function(entity) {
            return this.buildChecks().every(function(check) { return check(entity.tags); });
        
        },
        // borrowed from Way#isArea()
        inferGeometry() {
            // keys is a map of osm key + all found values across the selector map.
            var selectorKeys = _reduce(Object.keys(selector), function(expectedTags, key) {
                var values;
                if(/regex/gi.test(key)) {
                    Object.keys(p[key]).forEach(function(regexKey) {
                        values = p[key][rKey].map(function(val) { return val.replace(/\$|\^/g, '') })
                        if (expectedTags.hasOwnProperty(regexKey)) {
                            values = values.concat(expectedTags[regexKey])

                        }
                        expectedTags[regexKey] = values
                    })
                } 
                if (key === 'equals') {
                    var equalsKey = Object.keys(p[key])[0]
                    values = [p[key][equalsKey]]
                    if (expectedTags.hasOwnProperty(equalsKey)) {
                        values = values.concat(expectedTags[equalsKey])
                    }
                    expectedTags[equalsKey] = values
                }
                return expectedTags
            }, {})

            if (Object.keys(keys).indexOf('area') > -1) {
                inferredGeometry = 'area'; 
                return;
            }

            for (var key in Object.keys(keys)) {
                if (key in areaKeys) {
                    if (keys[key] !== 'absence' && key in ) {

                    }
                }

            }

        },
        geometryMatches: function(entity, graph) {
            if (entity.type === 'node' || entity.type === 'relation') { 
                return selector.geometry === entity.type; 
            } else if (entity.type === 'way') {
                return this.inferGeometry() === entity.geometry(graph);
            }
        
        },
        findWarnings: function (entity, graph, warnings) {
            if (this.geometryMatches(entity, graph) && this.matches(entity)) {
                warnings.push({
                    id: 'mapcss_' + rule.type,
                    message: selector[rule.type],
                    entity: entity
                });
            }
        
        }
    };

    return rule;
}

import _isMatch from 'lodash-es/isMatch';
import _intersection from 'lodash-es/intersection';
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
        selector: function() {
            return selector;
        },
        buildTagMap: function() {
            var selector = this.selector(), selectorKeys = Object.keys(selector);
            var tagMap = _reduce(selectorKeys, function (expectedTags, key) {
                var values;
                if (/regex/gi.test(key)) {
                    Object.keys(selector[key]).forEach(function(regexKey) {
                        values = selector[key][regexKey].map(function(val) {
                            return val.replace(/\$|\^/g, '');
                        });
                        
                        if (expectedTags.hasOwnProperty(regexKey)) {
                            values = values.concat(expectedTags[regexKey]);
                        }
                        
                        expectedTags[regexKey] = values;
                    });
                } 
                if (/(greater|less)Than(Equal)?|equals|presence/g.test(key)) {
                    var tagKey = /presence/.test(key) ? selector[key] : Object.keys(selector[key])[0];
                    
                    values = (key === 'equals') ? [selector[key][tagKey]] : [];
                    
                    if (expectedTags.hasOwnProperty(tagKey)) {
                        values = (key === 'equals') ? values.concat(expectedTags[tagKey]) : [];
                    }
                    
                    expectedTags[tagKey] = values;
                }
                return expectedTags;
            }, {});
            return tagMap;
        },
        matches: function(entity) {
            return this.buildChecks().every(function(check) { return check(entity.tags); });
        
        },
        areaKeys: function() {
            return areaKeys;
        },
        // borrowed from Way#isArea()
        inferGeometry: function () {
            var tagMap = this.buildTagMap();
            var areaKeys = this.areaKeys();
            var lineKeys = {
                highway: {
                    rest_area: true,
                    services: true
                },
                railway: {
                    roundhouse: true,
                    station: true,
                    traverser: true,
                    turntable: true,
                    wash: true
                }
            };
            var isAreaKeyBlackList = function(key) {
                return _intersection(tagMap[key], Object.keys(areaKeys[key])).length > 0;
            };
            var isLineKeysWhiteList = function(key) {
                return _intersection(tagMap[key], Object.keys(lineKeys[key])).length > 0;
            };

            if (tagMap.hasOwnProperty('area')) {
                if (tagMap.area.indexOf('yes') > -1) {
                    return 'area';
                }
                if (tagMap.area.indexOf('no') > -1) {
                    return 'line';
                }
            }

            for (var key in tagMap) {
                if (key in areaKeys && !isAreaKeyBlackList(key)) {
                    return 'area';
                }
                if (key in lineKeys && isLineKeysWhiteList(key)) {
                    return 'area';
                }
            }

            return 'line';
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

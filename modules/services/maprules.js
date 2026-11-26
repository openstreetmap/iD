import { osmAreaKeys as areaKeys } from '../osm/tags';
import { utilArrayIntersection } from '../util';
import { validationIssue } from '../core/validation';


var buildRuleChecks = function() {
    return {
        equals: function (equals) {
            return function(tags) {
                return Object.keys(equals).every(function(k) {
                    return equals[k] === tags[k];
                });
            };
        },
        notEquals: function (notEquals) {
            return function(tags) {
                return Object.keys(notEquals).some(function(k) {
                    return notEquals[k] !== tags[k];
                });
            };
        },
        absence: function(absence) {
            return function(tags) {
                return Object.keys(tags).indexOf(absence) === -1;
            };
        },
        presence: function(presence) {
            return function(tags) {
                return Object.keys(tags).indexOf(presence) > -1;
            };
        },
        greaterThan: function(greaterThan) {
            var key = Object.keys(greaterThan)[0];
            var value = greaterThan[key];

            return function(tags) {
                return tags[key] > value;
            };
        },
        greaterThanEqual: function(greaterThanEqual) {
            var key = Object.keys(greaterThanEqual)[0];
            var value = greaterThanEqual[key];

            return function(tags) {
                return tags[key] >= value;
            };
        },
        lessThan: function(lessThan) {
            var key = Object.keys(lessThan)[0];
            var value = lessThan[key];

            return function(tags) {
                return tags[key] < value;
            };
        },
        lessThanEqual: function(lessThanEqual) {
            var key = Object.keys(lessThanEqual)[0];
            var value = lessThanEqual[key];

            return function(tags) {
                return tags[key] <= value;
            };
        },
        positiveRegex: function(positiveRegex) {
            var tagKey = Object.keys(positiveRegex)[0];
            var expression = positiveRegex[tagKey].join('|');
            var regex = new RegExp(expression);

            return function(tags) {
                return regex.test(tags[tagKey]);
            };
        },
        negativeRegex: function(negativeRegex) {
            var tagKey = Object.keys(negativeRegex)[0];
            var expression = negativeRegex[tagKey].join('|');
            var regex = new RegExp(expression);

            return function(tags) {
                return !regex.test(tags[tagKey]);
            };
        }
    };
};

var buildLineKeys = function() {
    return {
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
};

export default {
    init: function() {
        this._ruleChecks  = buildRuleChecks();
        this._validationRules = [];
        this._areaKeys = areaKeys;
        this._lineKeys = buildLineKeys();
    },

    // list of rules only relevant to tag checks...
    filterRuleChecks: function(selector) {
        var _ruleChecks = this._ruleChecks;
        return Object.keys(selector).reduce(function(rules, key) {
            if (['geometry', 'error', 'warning'].indexOf(key) === -1) {
                rules.push(_ruleChecks[key](selector[key]));
            }
            return rules;
        }, []);
    },

    // builds tagMap from mapcss-parse selector object...
    buildTagMap: function(selector) {
        var getRegexValues = function(regexes) {
            return regexes.map(function(regex) {
                return regex.replace(/\$|\^/g, '');
            });
        };

        var tagMap = Object.keys(selector).reduce(function (expectedTags, key) {
            var values;
            var isRegex = /regex/gi.test(key);
            var isEqual = /equals/gi.test(key);

            if (isRegex || isEqual) {
                Object.keys(selector[key]).forEach(function(selectorKey) {
                    values = isEqual ? [selector[key][selectorKey]] : getRegexValues(selector[key][selectorKey]);

                    if (expectedTags.hasOwnProperty(selectorKey)) {
                        values = values.concat(expectedTags[selectorKey]);
                    }

                    expectedTags[selectorKey] = values;
                });

            } else if (/(greater|less)Than(Equal)?|presence/g.test(key)) {
                var tagKey = /presence/.test(key) ? selector[key] : Object.keys(selector[key])[0];

                values = [selector[key][tagKey]];

                if (expectedTags.hasOwnProperty(tagKey)) {
                    values = values.concat(expectedTags[tagKey]);
                }

                expectedTags[tagKey] = values;
            }

            return expectedTags;
        }, {});

        return tagMap;
    },

    // inspired by osmWay#isArea()
    inferGeometry: function(tagMap) {
        var _lineKeys = this._lineKeys;
        var _areaKeys = this._areaKeys;

        var keyValueDoesNotImplyArea = function(key) {
            return utilArrayIntersection(tagMap[key], Object.keys(_areaKeys[key])).length > 0;
        };
        var keyValueImpliesLine = function(key) {
            return utilArrayIntersection(tagMap[key], Object.keys(_lineKeys[key])).length > 0;
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
            if (key in _areaKeys && !keyValueDoesNotImplyArea(key)) {
                return 'area';
            }
            if (key in _lineKeys && keyValueImpliesLine(key)) {
                return 'area';
            }
        }

        return 'line';
    },

    // adds from mapcss-parse selector check...
    addRule: function(selector) {
        var rule = {
            // checks relevant to mapcss-selector
            checks: this.filterRuleChecks(selector),
            // true if all conditions for a tag error are true..
            matches: function(entity) {
                return this.checks.every(function(check) {
                    return check(entity.tags);
                });
            },
            // borrowed from Way#isArea()
            inferredGeometry: this.inferGeometry(this.buildTagMap(selector), this._areaKeys),
            geometryMatches: function(entity, graph) {
                if (entity.type === 'node' || entity.type === 'relation') {
                    return selector.geometry === entity.type;
                } else if (entity.type === 'way') {
                    return this.inferredGeometry === entity.geometry(graph);
                }
            },
            // when geometries match and tag matches are present, return a warning...
            findIssues: function (entity, graph, issues) {
                if (this.geometryMatches(entity, graph) && this.matches(entity)) {
                    var severity = Object.keys(selector).indexOf('error') > -1
                            ? 'error'
                            : 'warning';
                    var message = selector[severity];
                    issues.push(new validationIssue({
                        type: 'maprules',
                        severity: severity,
                        message: function() {
                            return message;
                        },
                        entityIds: [entity.id]
                    }));
                }
            }
        };
        this._validationRules.push(rule);
    },

    clearRules: function() { this._validationRules = []; },

    // returns validationRules...
    validationRules: function() { return this._validationRules; },

    // returns ruleChecks
    ruleChecks: function() { return this._ruleChecks; }
};

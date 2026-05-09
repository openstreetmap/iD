import { json as d3_json } from 'd3-fetch';

import { actionChangeTags } from '../actions/change_tags';
import { t } from '../core/localizer';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmAreaKeys as areaKeys } from '../osm/tags';
import { utilArrayIntersection } from '../util';


/** Keys on a selector that are not tag-condition checks (see #filterRuleChecks). */
var SELECTOR_META_KEYS = {
    geometry: true,
    error: true,
    warning: true,
    suggestion: true,
    fixes: true
};


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

    /**
     * Fetches maprules JSON from a URL (e.g. `#maprules=` hash value),
     * initializes the service, registers each selector, and logs `[maprules]`
     * success or failure to the console. Expects a JSON array of selector
     * objects.
     *
     * @param {string} maprulesUrl
     */
    loadFromUrl: function (maprulesUrl) {
        const self = this;
        d3_json(maprulesUrl)
          .then(function (mapcss) {
            self.init();
            if (!Array.isArray(mapcss)) {
              console.warn(  // eslint-disable-line no-console
                '[maprules] expected the JSON at ' + maprulesUrl +
                ' to be an array of selector objects, got ' + typeof mapcss +
                '. No rules loaded.'
              );
              return;
            }
            mapcss.forEach(function (mapcssSelector) {
              self.addRule(mapcssSelector);
            });
            console.info(  // eslint-disable-line no-console
              '[maprules] loaded ' + mapcss.length + ' rule(s) from ' + maprulesUrl,
              mapcss
            );
          })
          .catch(function (err) {
            console.warn(  // eslint-disable-line no-console
              '[maprules] failed to load rules from ' + maprulesUrl + ':', err
            );
          });
    },

    // list of rules only relevant to tag checks...
    filterRuleChecks: function(selector) {
        var _ruleChecks = this._ruleChecks;
        return Object.keys(selector).reduce(function(rules, key) {
            if (SELECTOR_META_KEYS[key]) {
                return rules;
            }
            rules.push(_ruleChecks[key](selector[key]));
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
        var hasError = typeof selector.error === 'string' && selector.error.length > 0;
        var hasWarning = typeof selector.warning === 'string' && selector.warning.length > 0;
        var hasSuggestion = typeof selector.suggestion === 'string' && selector.suggestion.length > 0;
        var messageKeyCount = (hasError ? 1 : 0) + (hasWarning ? 1 : 0) + (hasSuggestion ? 1 : 0);

        if (messageKeyCount === 0) {
            console.warn(  // eslint-disable-line no-console
                '[maprules] rule skipped: expected a non-empty string in exactly one of error, warning, suggestion',
                selector
            );
            return;
        }

        if (messageKeyCount > 1) {
            console.warn(  // eslint-disable-line no-console
                '[maprules] multiple message keys; using precedence error > warning > suggestion',
                selector
            );
        }

        var severity = hasError ? 'error' : (hasWarning ? 'warning' : 'suggestion');
        var messageText = hasError ? selector.error : (hasWarning ? selector.warning : selector.suggestion);

        var ruleIndex = this._validationRules.length;

        var validFixes = [];
        if (Array.isArray(selector.fixes)) {
            selector.fixes.forEach(function(entry, i) {
                if (!entry || typeof entry.title !== 'string' || entry.title.length === 0) {
                    console.warn(  // eslint-disable-line no-console
                        '[maprules] skipping fix entry ' + i + ': title must be a non-empty string',
                        entry
                    );
                    return;
                }
                if (!entry.tags || typeof entry.tags !== 'object' || Array.isArray(entry.tags) ||
                    Object.keys(entry.tags).length === 0) {
                    console.warn(  // eslint-disable-line no-console
                        '[maprules] skipping fix entry ' + i + ': tags must be a non-empty object',
                        entry
                    );
                    return;
                }
                validFixes.push({
                    title: entry.title,
                    tags: entry.tags,
                    icon: (typeof entry.icon === 'string' && entry.icon.length > 0) ? entry.icon : null
                });
            });
        }

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
            findIssues: function (entity, graph, issues) {
                if (this.geometryMatches(entity, graph) && this.matches(entity)) {
                    var issueAttrs = {
                        type: 'maprules',
                        severity: severity,
                        hash: 'maprules-' + ruleIndex,
                        /**
                         * Returns a renderer that writes the user-supplied
                         * message string into a d3 selection as plain text.
                         *
                         * The string comes verbatim from the maprules JSON
                         * file and must NOT be passed through the localizer
                         * (which would treat it as a translation key and emit
                         * a "Missing translation" warning).
                         *
                         * @returns {(selection: any) => void} d3 text renderer
                         */
                        message: function () {
                            return function (selection) {
                                selection.text(messageText);
                            };
                        },
                        entityIds: [entity.id]
                    };

                    if (validFixes.length > 0) {
                        issueAttrs.dynamicFixes = function (/* context */) {
                            return validFixes.map(function(entry, fixIndex) {
                                return new validationIssueFix({
                                    id: 'maprules-' + ruleIndex + '-' + fixIndex,
                                    title: function (selection) {
                                        selection.text(entry.title);
                                    },
                                    icon: entry.icon || undefined,
                                    onClick: function (context) {
                                        var id = this.issue.entityIds[0];
                                        var ent = context.hasEntity(id);
                                        if (!ent) return;
                                        var newTags = Object.assign({}, ent.tags, entry.tags);
                                        context.perform(
                                            actionChangeTags(id, newTags),
                                            t('issues.fix.maprules_apply_tags.annotation')
                                        );
                                    }
                                });
                            });
                        };
                    }

                    issues.push(new validationIssue(issueAttrs));
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

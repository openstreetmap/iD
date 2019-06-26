
import { data } from '../../data/index';
import { t } from '../util/locale';

function entityGroup(id, group) {
    group = Object.assign({}, group);   // shallow copy

    group.id = id;

    group.scoredPresetsByGeometry = {};

    group.scoredPresets = function() {
        var allScoredPresets = [];
        function addScoredPreset(scoredPresetForGeom) {
            var existingScoredPresetIndex = allScoredPresets.findIndex(function(item) {
                return item.preset === scoredPresetForGeom.preset;
            });
            if (existingScoredPresetIndex === -1) {
                allScoredPresets.push(scoredPresetForGeom);
            }
        }
        for (var geom in group.scoredPresetsByGeometry) {
            group.scoredPresetsByGeometry[geom].forEach(addScoredPreset);
        }
        return allScoredPresets;
    };

    // returns the part of the `id` after the last slash
    group.basicID = function() {
        var index = group.id.lastIndexOf('/');
        return index === -1 ? group.id : group.id.substring(index + 1);
    };

    group.localizedName = function() {
        return group.name ? t('presets.groups.' + id + '.name') : null;
    };

    group.localizedDescription = function() {
        return group.description ? t('presets.groups.' + id + '.description') : null;
    };

    group.toggleableMax = function() {
        if (group.toggleable && typeof group.toggleable === 'object') return group.toggleable.maxShown;
        return null;
    };

    group.matchesTags = function(tags, geometry) {

        var allGroups = groupManager.groups();

        return matchesRule(group.matches);

        function matchesTagComponent(ruleKey, tagComponent) {
            var keysToCheck = [ruleKey];
            if (ruleKey === '*') {
                // check if any key has one of the tag values
                keysToCheck = Object.keys(tags);

                if (keysToCheck.length === 0) return false;
            }
            var val = tagComponent[ruleKey];
            for (var i in keysToCheck) {
                var key = keysToCheck[i];
                var entityValue = tags[key];
                if (typeof val === 'string') {
                    if (!entityValue || (val !== entityValue && val !== '*')) continue;
                } else {
                    // object like { "value1": boolean }

                    if (!entityValue || (!val['*'] && !val[entityValue])) continue;
                    if (val[entityValue] === false) continue;
                }
                return true;
            }
            return false;
        }

        function matchesRule(rule) {
            if (rule.any) {
                return rule.any.some(matchesRule);
            } else if (rule.all) {
                return rule.all.every(matchesRule);
            } else if (rule.none) {
                return !rule.none.some(matchesRule);
            } else if (rule.notAll) {
                return !rule.notAll.every(matchesRule);
            }

            if (rule.geometry) {
                if (Array.isArray(rule.geometry)) {
                    if (rule.geometry.indexOf(geometry) === -1) return false;
                } else {
                    if (rule.geometry !== geometry) return false;
                }
            }
            var ruleKey;
            if (rule.allTags) {
                for (ruleKey in rule.allTags) {
                    if (!matchesTagComponent(ruleKey, rule.allTags)) return false;
                }
            }
            if (rule.anyTags) {
                var didMatch = false;
                for (ruleKey in rule.anyTags) {
                    if (matchesTagComponent(ruleKey, rule.anyTags)) {
                        didMatch = true;
                        break;
                    }
                }
                if (!didMatch) return false;
            }

            if (rule.groups) {
                for (var otherGroupID in rule.groups) {
                    // avoid simple infinte recursion
                    if (otherGroupID === group.id) continue;
                    // skip erroneous group IDs
                    if (!allGroups[otherGroupID]) continue;

                    var matchesOther = allGroups[otherGroupID].matchesTags(tags, geometry);
                    if ((rule.groups[otherGroupID] && !matchesOther) ||
                        (!rule.groups[otherGroupID] && matchesOther)) return false;
                }
            }

            return true;
        }
    };

    return group;
}

function entityGroupManager() {

    var manager = {};

    var _groups = {};
    var _groupsArray = [];
    for (var id in data.groups) {
        var group = entityGroup(id, data.groups[id]);
        _groups[id] = group;
        _groupsArray.push(group);
    }

    manager.groups = function() {
        return _groups;
    };

    manager.groupsArray = function() {
        return _groupsArray;
    };

    manager.toggleableGroups = _groupsArray.filter(function(group) {
        return group.toggleable;
    });

    manager.clusterGroups = _groupsArray.filter(function(group) {
        return group.cluster;
    });

    manager.clearCachedPresets = function() {
        _groupsArray.forEach(function(group) {
            group.scoredPresetsByGeometry = {};
        });
    };

    return manager;
}

var groupManager = entityGroupManager();

// use a singleton
export { groupManager };

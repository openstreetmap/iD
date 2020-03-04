import { dispatch as d3_dispatch } from 'd3-dispatch';

import { coreDifference } from './difference';
import { geoExtent } from '../geo/extent';
import { modeSelect } from '../modes/select';
import { utilArrayGroupBy, utilRebind } from '../util';
import { t } from '../util/locale';
import * as Validations from '../validations/index';


export function coreValidator(context) {
    var dispatch = d3_dispatch('validated', 'focusedIssue');
    var validator = utilRebind({}, dispatch, 'on');

    var _rules = {};
    var _disabledRules = {};

    var _ignoredIssueIDs = {};          // issue.id -> true
    var _baseCache = validationCache(); // issues before any user edits
    var _headCache = validationCache(); // issues after all user edits
    var _validatedGraph = null;
    var _deferred = new Set();

    //
    // initialize the validator rulesets
    //
    validator.init = function() {
        Object.values(Validations).forEach(function(validation) {
            if (typeof validation !== 'function') return;

            var fn = validation(context);
            var key = fn.type;
            _rules[key] = fn;
        });

        var disabledRules = context.storage('validate-disabledRules');
        if (disabledRules) {
            disabledRules.split(',')
                .forEach(function(key) { _disabledRules[key] = true; });
        }
    };


    //
    // clear caches, called whenever iD resets after a save
    //
    validator.reset = function() {
        Array.from(_deferred).forEach(function(handle) {
            window.cancelIdleCallback(handle);
            _deferred.delete(handle);
        });

        // clear caches
        _ignoredIssueIDs = {};
        _baseCache = validationCache();
        _headCache = validationCache();
        _validatedGraph = null;
    };

    validator.resetIgnoredIssues = function() {
        _ignoredIssueIDs = {};
        // reload UI
        dispatch.call('validated');
    };


    // must update issues when the user changes the unsquare thereshold
    validator.reloadUnsquareIssues = function() {

        reloadUnsquareIssues(_headCache, context.graph());
        reloadUnsquareIssues(_baseCache, context.history().base());

        dispatch.call('validated');
    };

    function reloadUnsquareIssues(cache, graph) {

        var checkUnsquareWay = _rules.unsquare_way;
        if (typeof checkUnsquareWay !== 'function') return;

        // uncache existing
        cache.uncacheIssuesOfType('unsquare_way');

        var buildings = context.history().tree().intersects(geoExtent([-180,-90],[180, 90]), graph)  // everywhere
            .filter(function(entity) {
                return entity.type === 'way' && entity.tags.building && entity.tags.building !== 'no';
            });

        // rerun for all buildings
        buildings.forEach(function(entity) {
            var detected = checkUnsquareWay(entity, graph);
            if (detected.length !== 1) return;
            var issue = detected[0];
            if (!cache.issuesByEntityID[entity.id]) {
                cache.issuesByEntityID[entity.id] = new Set();
            }
            cache.issuesByEntityID[entity.id].add(issue.id);
            cache.issuesByIssueID[issue.id] = issue;
        });
    }

    // options = {
    //     what: 'all',     // 'all' or 'edited'
    //     where: 'all',   // 'all' or 'visible'
    //     includeIgnored: false   // true, false, or 'only'
    //     includeDisabledRules: false   // true, false, or 'only'
    // };
    validator.getIssues = function(options) {
        var opts = Object.assign({ what: 'all', where: 'all', includeIgnored: false, includeDisabledRules: false }, options);
        var issues = Object.values(_headCache.issuesByIssueID);
        var view = context.map().extent();

        return issues.filter(function(issue) {
            if (opts.includeDisabledRules === 'only' && !_disabledRules[issue.type]) return false;
            if (!opts.includeDisabledRules && _disabledRules[issue.type]) return false;

            if (opts.includeIgnored === 'only' && !_ignoredIssueIDs[issue.id]) return false;
            if (!opts.includeIgnored && _ignoredIssueIDs[issue.id]) return false;

            // Sanity check:  This issue may be for an entity that not longer exists.
            // If we detect this, uncache and return false so it is not included..
            var entityIds = issue.entityIds || [];
            for (var i = 0; i < entityIds.length; i++) {
                var entityId = entityIds[i];
                if (!context.hasEntity(entityId)) {
                    delete _headCache.issuesByEntityID[entityId];
                    delete _headCache.issuesByIssueID[issue.id];
                    return false;
                }
            }

            if (opts.what === 'edited' && _baseCache.issuesByIssueID[issue.id]) return false;

            if (opts.where === 'visible') {
                var extent = issue.extent(context.graph());
                if (!view.intersects(extent)) return false;
            }

            return true;
        });
    };

    validator.getResolvedIssues = function() {
        var baseIssues = Object.values(_baseCache.issuesByIssueID);
        return baseIssues.filter(function(issue) {
            return !_headCache.issuesByIssueID[issue.id];
        });
    };

    validator.focusIssue = function(issue) {
        var extent = issue.extent(context.graph());

        if (extent) {
            var setZoom = Math.max(context.map().zoom(), 19);
            context.map().unobscuredCenterZoomEase(extent.center(), setZoom);

            // select the first entity
            if (issue.entityIds && issue.entityIds.length) {
                window.setTimeout(function() {
                    var ids = issue.entityIds;
                    context.enter(modeSelect(context, [ids[0]]));
                    dispatch.call('focusedIssue', this, issue);
                }, 250);  // after ease
            }
        }
    };


    validator.getIssuesBySeverity = function(options) {
        var groups = utilArrayGroupBy(validator.getIssues(options), 'severity');
        groups.error = groups.error || [];
        groups.warning = groups.warning || [];
        return groups;
    };

    // show some issue types in a particular order
    var orderedIssueTypes = [
        // flag missing data first
        'missing_tag', 'missing_role',
        // then flag identity issues
        'outdated_tags', 'mismatched_geometry',
        // flag geometry issues where fixing them might solve connectivity issues
        'crossing_ways', 'almost_junction',
        // then flag connectivity issues
        'disconnected_way', 'impossible_oneway'
    ];

    validator.getEntityIssues = function(entityID, options) {
        var cache = _headCache;

        var issueIDs = cache.issuesByEntityID[entityID];
        if (!issueIDs) return [];

        var opts = options || {};

        return Array.from(issueIDs)
            .map(function(id) { return cache.issuesByIssueID[id]; })
            .filter(function(issue) {
                if (opts.includeDisabledRules === 'only' && !_disabledRules[issue.type]) return false;
                if (!opts.includeDisabledRules && _disabledRules[issue.type]) return false;

                if (opts.includeIgnored === 'only' && !_ignoredIssueIDs[issue.id]) return false;
                if (!opts.includeIgnored && _ignoredIssueIDs[issue.id]) return false;

                return true;
            }).sort(function(issue1, issue2) {
                if (issue1.type === issue2.type) {
                    // issues of the same type, sort deterministically
                    return issue1.id < issue2.id ? -1 : 1;
                }
                var index1 = orderedIssueTypes.indexOf(issue1.type);
                var index2 = orderedIssueTypes.indexOf(issue2.type);
                if (index1 !== -1 && index2 !== -1) {
                    // both issue types have explicit sort orders
                    return index1 - index2;
                } else if (index1 === -1 && index2 === -1) {
                    // neither issue type has an explicit sort order, sort by type
                    return issue1.type < issue2.type ? -1 : 1;
                } else {
                    // order explicit types before everything else
                    return index1 !== -1 ? -1 : 1;
                }
            });
    };


    validator.getRuleKeys = function() {
        return Object.keys(_rules)
            .filter(function(key) { return key !== 'maprules'; })
            .sort(function(key1, key2) {
                // alphabetize by localized title
                return t('issues.' + key1 + '.title') < t('issues.' + key2 + '.title') ? -1 : 1;
            });
    };


    validator.isRuleEnabled = function(key) {
        return !_disabledRules[key];
    };


    validator.toggleRule = function(key) {
        if (_disabledRules[key]) {
            delete _disabledRules[key];
        } else {
            _disabledRules[key] = true;
        }

        context.storage('validate-disabledRules', Object.keys(_disabledRules).join(','));
        validator.validate();
    };


    validator.disableRules = function(keys) {
        _disabledRules = {};
        keys.forEach(function(k) {
            _disabledRules[k] = true;
        });

        context.storage('validate-disabledRules', Object.keys(_disabledRules).join(','));
        validator.validate();
    };


    validator.ignoreIssue = function(id) {
        _ignoredIssueIDs[id] = true;
    };


    //
    // Run validation on a single entity for the given graph
    //
    function validateEntity(entity, graph) {
        var entityIssues = [];

        // runs validation and appends resulting issues
        function runValidation(key) {

            var fn = _rules[key];
            if (typeof fn !== 'function') {
                console.error('no such validation rule = ' + key);  // eslint-disable-line no-console
                return;
            }

            var detected = fn(entity, graph);
            entityIssues = entityIssues.concat(detected);
        }

        // run all rules
        Object.keys(_rules).forEach(runValidation);

        return entityIssues;
    }

    function entityIDsToValidate(entityIDs, graph) {
        var processedIDs = new Set();
        return entityIDs.reduce(function(acc, entityID) {
            // keep redundancy check separate from `acc` because an `entityID`
            // could have been added to `acc` as a related entity through an earlier pass
            if (processedIDs.has(entityID)) return acc;
            processedIDs.add(entityID);

            var entity = graph.hasEntity(entityID);
            if (!entity) return acc;

            acc.add(entityID);

            var checkParentRels = [entity];

            if (entity.type === 'node') {
                graph.parentWays(entity).forEach(function(parentWay) {
                    acc.add(parentWay.id); // include parent ways
                    checkParentRels.push(parentWay);
                });
            } else if (entity.type === 'relation') {
                entity.members.forEach(function(member) {
                    acc.add(member.id); // include members
                });
            } else if (entity.type === 'way') {
                entity.nodes.forEach(function(nodeID) {
                    acc.add(nodeID); // include child nodes
                    graph._parentWays[nodeID].forEach(function(wayID) {
                        acc.add(wayID); // include connected ways
                    });
                });
            }

            checkParentRels.forEach(function(entity) {   // include parent relations
                if (entity.type !== 'relation') {        // but not super-relations
                    graph.parentRelations(entity).forEach(function(parentRelation) {
                        acc.add(parentRelation.id);
                    });
                }
            });

            return acc;

        }, new Set());
    }

    //
    // Run validation for several entities, supplied `entityIDs`,
    // against `graph` for the given `cache`
    //
    function validateEntities(entityIDs, graph, cache) {

        // clear caches for existing issues related to these entities
        entityIDs.forEach(cache.uncacheEntityID);

        // detect new issues and update caches
        entityIDs.forEach(function(entityID) {
            var entity = graph.hasEntity(entityID);
            // don't validate deleted entities
            if (!entity) return;

            var issues = validateEntity(entity, graph);
            cache.cacheIssues(issues);
        });
    }


    //
    // Validates anything that has changed since the last time it was run.
    // Also updates the "validatedGraph" to be the current graph
    // and dispatches a `validated` event when finished.
    //
    validator.validate = function() {

        var currGraph = context.graph();
        _validatedGraph = _validatedGraph || context.history().base();
        if (currGraph === _validatedGraph) {
            dispatch.call('validated');
            return;
        }
        var oldGraph = _validatedGraph;
        var difference = coreDifference(oldGraph, currGraph);
        _validatedGraph = currGraph;

        var createdAndModifiedEntityIDs = difference.extantIDs(true);   // created/modified (true = w/relation members)
        var entityIDsToCheck = entityIDsToValidate(createdAndModifiedEntityIDs, currGraph);

        // check modified and deleted entities against the old graph in order to update their related entities
        // (e.g. deleting the only highway connected to a road should create a disconnected highway issue)
        var modifiedAndDeletedEntityIDs = difference.deleted().concat(difference.modified())
            .map(function(entity) { return entity.id; });
        var entityIDsToCheckForOldGraph = entityIDsToValidate(modifiedAndDeletedEntityIDs, oldGraph);

        // concat the sets
        entityIDsToCheckForOldGraph.forEach(entityIDsToCheck.add, entityIDsToCheck);

        validateEntities(entityIDsToCheck, context.graph(), _headCache);

        dispatch.call('validated');
    };


    // WHEN TO RUN VALIDATION:
    // When graph changes:
    context.history()
        .on('restore.validator', validator.validate)   // restore saved history
        .on('undone.validator', validator.validate)    // undo
        .on('redone.validator', validator.validate);   // redo
        // but not on 'change' (e.g. while drawing)

    // When user chages editing modes:
    context
        .on('exit.validator', validator.validate);

    // When merging fetched data:
    context.history()
        .on('merge.validator', function(entities) {
            if (!entities) return;
            var handle = window.requestIdleCallback(function() {
                var entityIDs = entities.map(function(entity) { return entity.id; });
                var headGraph = context.graph();
                validateEntities(entityIDsToValidate(entityIDs, headGraph), headGraph, _headCache);

                var baseGraph = context.history().base();
                validateEntities(entityIDsToValidate(entityIDs, baseGraph), baseGraph, _baseCache);

                dispatch.call('validated');
            });
            _deferred.add(handle);
        });


    return validator;
}


function validationCache() {

    var cache = {
        issuesByIssueID: {},  // issue.id -> issue
        issuesByEntityID: {} // entity.id -> set(issue.id)
    };

    cache.cacheIssues = function(issues) {
        issues.forEach(function(issue) {
            var entityIds = issue.entityIds || [];
            entityIds.forEach(function(entityId) {
                if (!cache.issuesByEntityID[entityId]) {
                    cache.issuesByEntityID[entityId] = new Set();
                }
                cache.issuesByEntityID[entityId].add(issue.id);
            });
            cache.issuesByIssueID[issue.id] = issue;
        });
    };

    cache.uncacheIssue = function(issue) {
        // When multiple entities are involved (e.g. crossing_ways),
        // remove this issue from the other entity caches too..
        var entityIds = issue.entityIds || [];
        entityIds.forEach(function(entityId) {
            if (cache.issuesByEntityID[entityId]) {
                cache.issuesByEntityID[entityId].delete(issue.id);
            }
        });
        delete cache.issuesByIssueID[issue.id];
    };

    cache.uncacheIssues = function(issues) {
        issues.forEach(cache.uncacheIssue);
    };

    cache.uncacheIssuesOfType = function(type) {
        var issuesOfType = Object.values(cache.issuesByIssueID)
            .filter(function(issue) { return issue.type === type; });
        cache.uncacheIssues(issuesOfType);
    };

    //
    // Remove a single entity and all its related issues from the caches
    //
    cache.uncacheEntityID = function(entityID) {
        var issueIDs = cache.issuesByEntityID[entityID];
        if (!issueIDs) return;

        issueIDs.forEach(function(issueID) {
            var issue = cache.issuesByIssueID[issueID];
            if (issue) {
                cache.uncacheIssue(issue);
            } else {
                delete cache.issuesByIssueID[issueID];
            }
        });

        delete cache.issuesByEntityID[entityID];
    };

    return cache;
}

import { dispatch as d3_dispatch } from 'd3-dispatch';

import { coreDifference } from './difference';
import { geoExtent } from '../geo/extent';
import { modeSelect } from '../modes/select';
import { utilArrayGroupBy, utilRebind } from '../util';
import { t } from '../util/locale';
import { validationIssueFix } from './validation/models';
import * as Validations from '../validations/index';


export function coreValidator(context) {
    var dispatch = d3_dispatch('validated', 'focusedIssue');
    var validator = utilRebind({}, dispatch, 'on');

    var _rules = {};
    var _disabledRules = {};

    var _ignoredIssueIDs = {};       // issue.id -> true
    var _issuesByIssueID = {};       // issue.id -> issue
    var _issuesByEntityID = {};      // entity.id -> set(issue.id)
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
        _issuesByIssueID = {};
        _issuesByEntityID = {};
        _validatedGraph = null;

        for (var key in _rules) {
            if (typeof _rules[key].reset === 'function') {
                _rules[key].reset();   // 'crossing_ways' is the only one like this
            }
        }
    };

    validator.resetIgnoredIssues = function() {
        _ignoredIssueIDs = {};
        // reload UI
        dispatch.call('validated');
    };


    // when the user changes the squaring thereshold, rerun this on all buildings
    validator.changeSquareThreshold = function() {
        var checkUnsquareWay = _rules.unsquare_way;
        if (typeof checkUnsquareWay !== 'function') return;

        // uncache existing
        Object.values(_issuesByIssueID)
            .filter(function(issue) { return issue.type === 'unsquare_way'; })
            .forEach(function(issue) {
                var entityId = issue.entityIds[0];   // always 1 entity for unsquare way
                if (_issuesByEntityID[entityId]) {
                    _issuesByEntityID[entityId].delete(issue.id);
                }
                delete _issuesByIssueID[issue.id];
            });

        var buildings = context.intersects(geoExtent([-180,-90],[180, 90]))  // everywhere
            .filter(function(entity) {
                return entity.type === 'way' && entity.tags.building && entity.tags.building !== 'no';
            });

        // rerun for all buildings
        buildings.forEach(function(entity) {
            var detected = checkUnsquareWay(entity, context.graph());
            if (detected.length !== 1) return;

            var issue = detected[0];
            var ignoreFix = new validationIssueFix({
                title: t('issues.fix.ignore_issue.title'),
                icon: 'iD-icon-close',
                onClick: function() {
                    ignoreIssue(this.issue.id);
                }
            });
            ignoreFix.type = 'ignore';
            ignoreFix.issue = issue;
            issue.fixes.push(ignoreFix);

            if (!_issuesByEntityID[entity.id]) {
                _issuesByEntityID[entity.id] = new Set();
            }
            _issuesByEntityID[entity.id].add(issue.id);
            _issuesByIssueID[issue.id] = issue;
        });

        dispatch.call('validated');
    };


    // options = {
    //     what: 'all',     // 'all' or 'edited'
    //     where: 'all',   // 'all' or 'visible'
    //     includeIgnored: false   // true, false, or 'only'
    //     includeDisabledRules: false   // true, false, or 'only'
    // };
    validator.getIssues = function(options) {
        var opts = Object.assign({ what: 'all', where: 'all', includeIgnored: false, includeDisabledRules: false }, options);
        var issues = Object.values(_issuesByIssueID);
        var changes = context.history().difference().changes();
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
                    delete _issuesByEntityID[entityId];
                    delete _issuesByIssueID[issue.id];
                    return false;
                }
            }

            if (opts.what === 'edited') {
                var isEdited = entityIds.some(function(entityId) { return changes[entityId]; });
                if (entityIds.length && !isEdited) return false;
            }

            if (opts.where === 'visible') {
                var extent = issue.extent(context.graph());
                if (!view.intersects(extent)) return false;
            }

            return true;
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


    validator.getEntityIssues = function(entityID, options) {
        var issueIDs = _issuesByEntityID[entityID];
        if (!issueIDs) return [];

        var opts = options || {};

        return Array.from(issueIDs)
            .map(function(id) { return _issuesByIssueID[id]; })
            .filter(function(issue) {
                if (opts.includeDisabledRules === 'only' && !_disabledRules[issue.type]) return false;
                if (!opts.includeDisabledRules && _disabledRules[issue.type]) return false;

                if (opts.includeIgnored === 'only' && !_ignoredIssueIDs[issue.id]) return false;
                if (!opts.includeIgnored && _ignoredIssueIDs[issue.id]) return false;

                return true;
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


    //
    // Remove a single entity and all its related issues from the caches
    //
    function uncacheEntityID(entityID) {
        var issueIDs = _issuesByEntityID[entityID];
        if (!issueIDs) return;

        issueIDs.forEach(function(issueID) {
            var issue = _issuesByIssueID[issueID];
            if (issue) {
                // When multiple entities are involved (e.g. crossing_ways),
                // remove this issue from the other entity caches too..
                var entityIds = issue.entityIds || [];
                entityIds.forEach(function(other) {
                    if (other !== entityID) {
                        if (_issuesByEntityID[other]) {
                            _issuesByEntityID[other].delete(issueID);
                        }
                    }
                });
            }

            delete _issuesByIssueID[issueID];
        });

        delete _issuesByEntityID[entityID];
    }


    function ignoreIssue(id) {
        _ignoredIssueIDs[id] = true;
    }


    //
    // Run validation on a single entity for the given graph
    //
    function validateEntity(entity, graph) {
        var entityIssues = [];
        var ran = {};

        // runs validation and appends resulting issues,
        // returning true if validation passed without issue
        function runValidation(key) {
            if (ran[key]) return true;

            var fn = _rules[key];
            if (typeof fn !== 'function') {
                console.error('no such validation rule = ' + key);  // eslint-disable-line no-console
                ran[key] = true;
                return true;
            }

            var detected = fn(entity, graph);
            detected.forEach(function(issue) {
                var hasIgnoreFix = issue.fixes && issue.fixes.length && issue.fixes[issue.fixes.length - 1].type === 'ignore';
                if (issue.severity === 'warning' && !hasIgnoreFix) {
                    var ignoreFix = new validationIssueFix({
                        title: t('issues.fix.ignore_issue.title'),
                        icon: 'iD-icon-close',
                        onClick: function() {
                            ignoreIssue(this.issue.id);
                        }
                    });
                    ignoreFix.type = 'ignore';
                    ignoreFix.issue = issue;
                    issue.fixes.push(ignoreFix);
                }
            });
            entityIssues = entityIssues.concat(detected);
            ran[key] = true;
            return !detected.length;
        }

        // run some validations manually to control the order and to skip some

        runValidation('missing_role');

        if (entity.type === 'relation') {
            if (!runValidation('outdated_tags')) {
                // don't flag missing tags if they are on the outer way
                ran.missing_tag = true;
            }
        }

        runValidation('missing_tag');

        runValidation('outdated_tags');

        runValidation('crossing_ways');
        runValidation('almost_junction');

        // only check impossible_oneway if no disconnected_way issues
        if (runValidation('disconnected_way')) {
            runValidation('impossible_oneway');
        } else {
            ran.impossible_oneway = true;
        }

        runValidation('tag_suggests_area');

        // run all rules not yet run
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

            if (entity.type === 'node') {   // include parent ways
                graph.parentWays(entity).forEach(function(parentWay) {
                    acc.add(parentWay.id);
                    checkParentRels.push(parentWay);
                });
            } else if (entity.type === 'relation') {   // include members
                entity.members.forEach(function(member) {
                    acc.add(member.id);
                });
            } else if (entity.type === 'way') {   // include connected ways
                entity.nodes.forEach(function(nodeID) {
                    graph._parentWays[nodeID].forEach(function(wayID) {
                        acc.add(wayID);
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
    // Run validation for several entities, supplied `entityIDs`
    //
    function validateEntities(entityIDs) {

        var graph = context.graph();

        // clear caches for existing issues related to these entities
        entityIDs.forEach(uncacheEntityID);

        // detect new issues and update caches
        entityIDs.forEach(function(entityID) {
            var entity = graph.hasEntity(entityID);
            // don't validate deleted entities
            if (!entity) return;

            var issues = validateEntity(entity, graph);
            issues.forEach(function(issue) {
                var entityIds = issue.entityIds || [];
                entityIds.forEach(function(entityId) {
                    if (!_issuesByEntityID[entityId]) {
                        _issuesByEntityID[entityId] = new Set();
                    }
                    _issuesByEntityID[entityId].add(issue.id);
                });
                _issuesByIssueID[issue.id] = issue;
            });
        });

        dispatch.call('validated');
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

        for (var key in _rules) {
            if (typeof _rules[key].reset === 'function') {
                _rules[key].reset();   // 'crossing_ways' is the only one like this
            }
        }

        var createdAndModifiedEntityIDs = difference.extantIDs(true);   // created/modified (true = w/relation members)
        var entityIDsToCheck = entityIDsToValidate(createdAndModifiedEntityIDs, currGraph);

        // "validate" deleted entities in order to update their related entities
        // (e.g. deleting the only highway connected to a road should create a disconnected highway issue)
        var deletedEntityIDs = difference.deleted().map(function(entity) { return entity.id; });
        var entityIDsToCheckForDeleted = entityIDsToValidate(deletedEntityIDs, oldGraph);

        // concat the sets
        entityIDsToCheckForDeleted.forEach(entityIDsToCheck.add, entityIDsToCheck);

        validateEntities(entityIDsToCheck);   // dispatches 'validated'
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
                var ids = entities.map(function(entity) { return entity.id; });
                validateEntities(entityIDsToValidate(ids, context.graph()));
            });
            _deferred.add(handle);
        });


    return validator;
}

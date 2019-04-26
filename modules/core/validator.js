import { dispatch as d3_dispatch } from 'd3-dispatch';

import { coreDifference } from './difference';
import { utilArrayGroupBy, utilCallWhenIdle, utilRebind } from '../util';
import * as Validations from '../validations/index';


export function coreValidator(context) {
    var dispatch = d3_dispatch('validated');
    var validator = utilRebind({}, dispatch, 'on');

    var _rules = {};
    var _disabledRules = {};

    var _issuesByIssueID = {};       // issue.id -> issue
    var _issuesByEntityID = {};      // entity.id -> set(issue.id)
    var _validatedGraph = null;


    //
    // initialize the validator rulesets
    //
    validator.init = function() {
        Object.values(Validations).forEach(function(validation) {
            if (typeof validation !== 'function') return;

            var fn = validation();
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
        // clear caches
        _issuesByIssueID = {};
        _issuesByEntityID = {};
        _validatedGraph = null;

        for (var key in _rules) {
            if (typeof _rules[key].reset === 'function') {
                _rules[key].reset();   // 'crossing_ways' is the only one like this
            }
        }
    };


    // options = {
    //     what: 'edited',     // 'all' or 'edited'
    //     where: 'visible',   // 'all' or 'visible'
    // };
    validator.getIssues = function(options) {
        var opts = Object.assign({ what: 'all', where: 'all' }, options);
        var issues = Object.values(_issuesByIssueID);
        var changes = context.history().difference().changes();
        var view = context.map().extent();

        return issues.filter(function(issue) {
            if (_disabledRules[issue.type]) return false;

            // Sanity check:  This issue may be for an entity that not longer exists.
            // If we detect this, uncache and return false so it is not incluced..
            var entities = issue.entities || [];
            for (var i = 0; i < entities.length; i++) {
                var entity = entities[i];
                if (!context.hasEntity(entity.id)) {
                    delete _issuesByEntityID[entity.id];
                    delete _issuesByIssueID[issue.id];
                    return false;
                }
            }

            if (opts.what === 'edited') {
                var isEdited = entities.some(function(entity) { return changes[entity.id]; });
                if (entities.length && !isEdited) return false;
            }

            if (opts.where === 'visible') {
                var extent = issue.extent(context.graph());
                if (!view.intersects(extent)) return false;
            }

            return true;
        });
    };


    validator.getIssuesBySeverity = function(options) {
        var groups = utilArrayGroupBy(validator.getIssues(options), 'severity');
        groups.error = groups.error || [];
        groups.warning = groups.warning || [];
        return groups;
    };


    validator.getEntityIssues = function(entityID) {
        var issueIDs = _issuesByEntityID[entityID];
        if (!issueIDs) return [];

        return Array.from(issueIDs)
            .map(function(id) { return _issuesByIssueID[id]; })
            .filter(function(issue) { return !_disabledRules[issue.type]; });
    };


    validator.getRuleKeys = function() {
        return Object.keys(_rules)
            .filter(function(key) { return key !== 'maprules'; });
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
                var entities = issue.entities || [];
                entities.forEach(function(other) {
                    if (other.id !== entityID) {
                        var otherIssueIDs = _issuesByEntityID[other.id];
                        if (otherIssueIDs) {
                            otherIssueIDs.delete(issueID);
                        }
                    }
                });
            }

            delete _issuesByIssueID[issueID];
        });

        delete _issuesByEntityID[entityID];
    }


    //
    // Run validation on a single entity
    //
    function validateEntity(entity) {
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

            var detected = fn(entity, context);
            entityIssues = entityIssues.concat(detected);
            ran[key] = true;
            return !detected.length;
        }

        runValidation('missing_role');

        if (entity.type === 'relation') {
            if (!runValidation('outdated_tags')) {
                // don't flag missing tags if they are on the outer way
                ran.missing_tag = true;
            }
        }

        // other _rules require feature to be tagged
        if (!runValidation('missing_tag')) return entityIssues;

        // run outdated_tags early
        runValidation('outdated_tags');

        if (entity.type === 'way') {
            runValidation('crossing_ways');
            runValidation('almost_junction');

            // only check impossible_oneway if no disconnected_way issues
            if (runValidation('disconnected_way')) {
                runValidation('impossible_oneway');
            } else {
                ran.impossible_oneway = true;
            }

            runValidation('tag_suggests_area');
        }

        // run all rules not yet run
        Object.keys(_rules).forEach(runValidation);

        return entityIssues;
    }


    //
    // Run validation for several entities, supplied `entityIDs`
    //
    validator.validateEntities = function(entityIDs) {
        var graph = context.graph();

        var entityIDsToCheck = entityIDs.reduce(function(acc, entityID) {
            if (acc.has(entityID)) return acc;
            acc.add(entityID);

            var entity = graph.entity(entityID);
            var checkParentRels = [entity];

            if (entity.type === 'node') {   // include parent ways
                graph.parentWays(entity).forEach(function(parentWay) {
                    checkParentRels.push(parentWay);
                    acc.add(parentWay.id);
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

        // clear caches for existing issues related to changed entities
        entityIDsToCheck.forEach(uncacheEntityID);

        // detect new issues and update caches
        entityIDsToCheck.forEach(function(entityID) {
            var entity = graph.entity(entityID);
            var issues = validateEntity(entity);

            issues.forEach(function(issue) {
                var entities = issue.entities || [];
                entities.forEach(function(entity) {
                    if (!_issuesByEntityID[entity.id]) {
                        _issuesByEntityID[entity.id] = new Set();
                    }
                    _issuesByEntityID[entity.id].add(issue.id);
                });
                _issuesByIssueID[issue.id] = issue;
            });
        });

        dispatch.call('validated');
    };


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

        var difference = coreDifference(_validatedGraph, currGraph);
        _validatedGraph = currGraph;

        for (var key in _rules) {
            if (typeof _rules[key].reset === 'function') {
                _rules[key].reset();   // 'crossing_ways' is the only one like this
            }
        }

        var entityIDs = difference.extantIDs();  // created and modified
        difference.deleted().forEach(uncacheEntityID);   // deleted

        validator.validateEntities(entityIDs);   // dispatches 'validated'
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
            var ids = entities.map(function(entity) { return entity.id; });
            utilCallWhenIdle(function() { validator.validateEntities(ids); })();
        });


    return validator;
}

import { dispatch as d3_dispatch } from 'd3-dispatch';

import { coreDifference } from './difference';
import { geoExtent } from '../geo';
import { osmEntity } from '../osm';
import { utilArrayGroupBy, utilCallWhenIdle, utilRebind } from '../util';
import * as Validations from '../validations/index';


export function coreValidator(context) {
    var dispatch = d3_dispatch('validated');
    var validator = utilRebind({}, dispatch, 'on');

    var _rules = {};
    var _disabledRules = {};
    var _entityRules = [];
//    var _changesRules = [];        // skip for now

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

            if (fn.inputType === 'changes') {   // 'many_deletions' is the only one like this
//                _changesRules.push(key);      // skip for now
            } else {
                _entityRules.push(key);
            }
        });
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
    //     what: 'edited',    // 'all' or 'edited'
    //     where: 'visible'   // 'all' or 'visible'
    // };
    validator.getIssues = function(options) {
        var opts = Object.assign({ what: 'all', where: 'all' }, options);
        var issues = Object.values(_issuesByIssueID);
        var changes = context.history().difference().changes();
        var view = context.map().extent();

        return issues.filter(function(issue) {
            if (opts.what === 'edited') {
                var entities = issue.entities || [];
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
            .map(function(id) { return _issuesByIssueID[id]; });
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
        validator.validate();
    };


    //
    // Remove a single entity and all its related issues from the caches
    //
    function uncacheEntity(entity) {
        var issueIDs = _issuesByEntityID[entity.id];
        if (!issueIDs) return;

        issueIDs.forEach(function(issueID) {
            var issue = _issuesByIssueID[issueID];
            var entities = issue.entities || [];
            entities.forEach(function(other) {   // other entities will need to be revalidated
                if (other.id !== entity.id) {
                    delete _issuesByEntityID[other.id];
                }
            });
            delete _issuesByIssueID[issue.id];
        });
        delete _issuesByEntityID[entity.id];
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

            if (_disabledRules[key]) {   // skip disabled rules, but mark as having run
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
            if (!runValidation('old_multipolygon')) {
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

            // only check for disconnected way if no almost junctions
            if (runValidation('almost_junction')) {
                runValidation('disconnected_way');
            } else {
                ran.disconnected_way = true;
            }

            runValidation('tag_suggests_area');
        }

        // run all _rules not yet run manually
        _entityRules.forEach(runValidation);

        return entityIssues;
    }


    //
    // Run validation for several entities, supplied `entityIDs`
    // It uses the "validatedGraph", so this can be called asynchronously
    // as entities are loaded from OSM if we want to.
    //
    validator.validateEntities = function(entityIDs) {
        _validatedGraph = _validatedGraph || context.history().base();

        var entitiesToCheck = entityIDs.reduce(function(acc, entityID) {
            var entity = _validatedGraph.entity(entityID);
            if (acc.has(entity)) return acc;

            acc.add(entity);
            var checkParentRels = [entity];

            if (entity.type === 'node') {   // include parent ways
                _validatedGraph.parentWays(entity).forEach(function(parentWay) {
                    checkParentRels.push(parentWay);
                    acc.add(parentWay);
                });
            }

            checkParentRels.forEach(function(entity) {   // include parent relations
                if (entity.type !== 'relation') {     // but not super-relations
                    _validatedGraph.parentRelations(entity).forEach(function(parentRel) {
                        acc.add(parentRel);
                    });
                }
            });

            return acc;

        }, new Set());

        // clear caches for existing issues related to changed entities
        entitiesToCheck.forEach(uncacheEntity);

        // detect new issues and update caches
        entitiesToCheck.forEach(function(entity) {
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
        if (currGraph === _validatedGraph) return;

        var difference = coreDifference(_validatedGraph, currGraph);
        _validatedGraph = currGraph;

        for (var key in _rules) {
            if (typeof _rules[key].reset === 'function') {
                _rules[key].reset();   // 'crossing_ways' is the only one like this
            }
        }

        // _issues = utilArrayFlatten(_changesRules.map(function(ruleID) {
        //     if (_disabledRules[ruleID]) return [];
        //     var fn = _rules[ruleID];
        //     return fn(changes, context);
        // }));

        var entityIDs = difference.extantIDs();  // created and modified
        difference.deleted().forEach(uncacheEntity);   // deleted

        validator.validateEntities(entityIDs);   // dispatches 'validated'
    };



    // run validation upon restoring user's changes
    context.history().on('restore.validator', function() {
        validator.validate();
    });

    // re-run validation upon merging fetched data
    context.history().on('merge.validator', function(entities) {
        utilCallWhenIdle(function() {
            if (!entities) return;
            var ids = entities.map(function(entity) { return entity.id; });
            validator.validateEntities(ids);
        })();
    });

    // // re-run validation on history change (frequent)
    // context.history().on('change.validator', function(difference) {
    //     if (!difference) return;
    //     validator.validate();
    // });

    // re-run validation when the user switches editing modes (less frequent)
    context.on('exit.validator', function() {
        validator.validate();
    });


    return validator;
}



export function validationIssue(attrs) {
    this.type = attrs.type;                // required
    this.severity = attrs.severity;        // required - 'warning' or 'error'
    this.message = attrs.message;          // required - localized string
    this.tooltip = attrs.tooltip;          // required - localized string
    this.entities = attrs.entities;        // optional - array of entities
    this.loc = attrs.loc;                  // optional - expect a [lon, lat] array
    this.info = attrs.info;                // optional - object containing arbitrary extra information
    this.fixes = attrs.fixes;              // optional - array of validationIssueFix objects
    this.hash = attrs.hash;                // optional - string to further differentiate the issue

    this.id = generateID.apply(this);      // generated - see below

    // A unique, deterministic string hash.
    // Issues with identical id values are considered identical.
    function generateID() {
        var parts = [this.type];

        if (this.hash) {   // subclasses can pass in their own differentiator
            parts.push(this.hash);
        }

        // include entities this issue is for
        // (sort them so the id is deterministic)
        if (this.entities) {
            var entityKeys = this.entities.map(osmEntity.key).sort();
            parts.push.apply(parts, entityKeys);
        }

        // include loc since two separate issues can have an
        // idential type and entities, e.g. in crossing_ways
        if (this.loc) {
            parts.push.apply(parts, this.loc);
        }

        return parts.join(':');
    }

    var _extent;
    this.extent = function(resolver) {
        if (_extent) return _extent;

        if (this.loc) {
            return _extent = geoExtent(this.loc);
        }
        if (this.entities && this.entities.length) {
            return _extent = this.entities.reduce(function(extent, entity) {
                return extent.extend(entity.extent(resolver));
            }, geoExtent());
        }
        return null;
    };


    if (this.fixes) {   // add a reference in the fixes to the issue for use in fix actions
        for (var i = 0; i < this.fixes.length; i++) {
            this.fixes[i].issue = this;
        }
    }
}


export function validationIssueFix(attrs) {
    this.icon = attrs.icon;
    this.title = attrs.title;
    this.onClick = attrs.onClick;
    this.entityIds = attrs.entityIds || [];  // Used for hover-higlighting.
    this.issue = null;    // the issue this fix is for
}

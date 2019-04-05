import { dispatch as d3_dispatch } from 'd3-dispatch';

import { geoExtent } from '../geo';
import { osmEntity } from '../osm';
import { utilArrayFlatten, utilRebind } from '../util';
import * as Validations from '../validations/index';


export function coreValidator(context) {
    var dispatch = d3_dispatch('reload');
    var validator = {};

    var _rules = {};
    var _disabledRules = {};
    var _entityRules = [];
//    var _changesRules = [];        // skip for now

    var _issues = [];
    var _issuesByEntityID = {};



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


    validator.reset = function() {
        // clear caches
        _issues = [];
        _issuesByEntityID = {};
        for (var key in _rules) {
            if (typeof _rules[key].reset === 'function') {
                _rules[key].reset();   // 'crossing_ways' is the only one like this
            }
        }
    };


    validator.getIssues = function() {
        return _issues;
    };


    validator.getWarnings = function() {
        return _issues
            .filter(function(d) { return d.severity === 'warning'; });
    };


    validator.getErrors = function() {
        return _issues
            .filter(function(d) { return d.severity === 'error'; });
    };


    validator.getEntityIssues = function(entityID) {
        var entity = context.hasEntity(entityID);
        if (!entity) return [];

        if (!_issuesByEntityID[entityID]) {
            _issuesByEntityID[entityID] = validateEntity(entity);
        }
        return _issuesByEntityID[entityID];
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


    function validateEntity(entity) {
        var _issues = [];
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

            if (_disabledRules[key]) {   // don't run disabled, but mark as having run
                ran[key] = true;
                return true;
            }

            var detected = fn(entity, context);
            _issues = _issues.concat(detected);
            ran[key] = true;   // mark this validation as having run
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
        if (!runValidation('missing_tag')) return _issues;

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

        return _issues;
    }


    validator.validate = function() {
        // clear caches
        _issuesByEntityID = {};
        _issues = [];
        for (var key in _rules) {
            if (typeof _rules[key].reset === 'function') {
                _rules[key].reset();   // 'crossing_ways' is the only one like this
            }
        }

        var history = context.history();
        var changes = history.changes();
        var changesToCheck = changes.created.concat(changes.modified);
        var graph = history.graph();

        // _issues = utilArrayFlatten(_changesRules.map(function(ruleID) {
        //     if (_disabledRules[ruleID]) return [];
        //     var fn = _rules[ruleID];
        //     return fn(changes, context);
        // }));

        var entitiesToCheck = changesToCheck.reduce(function(acc, entity) {
            var entities = [entity];
            acc.add(entity);

            if (entity.type === 'node') {
                // check parent ways if their nodes have changed
                graph.parentWays(entity).forEach(function(parentWay) {
                    entities.push(parentWay);
                    acc.add(parentWay);
                });
            }

            entities.forEach(function(entity) {
                // check parent relations if their geometries have changed
                if (entity.type !== 'relation') {
                    graph.parentRelations(entity).forEach(function(parentRel) {
                        acc.add(parentRel);
                    });
                }
            });

            return acc;

        }, new Set());


        var issuesByID = {};

        entitiesToCheck.forEach(function(entity) {
            var entityIssues = validateEntity(entity);
            _issuesByEntityID[entity.id] = entityIssues;
            entityIssues.forEach(function(issue) {
                // Different entities can produce the same issue so store them by
                // the ID to ensure that there are no duplicate issues.
                issuesByID[issue.id()] = issue;
            });
        });

        for (var issueID in issuesByID) {
            _issues.push(issuesByID[issueID]);
        }

        dispatch.call('reload', validator, _issues);
    };

    return utilRebind(validator, dispatch, 'on');
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


    var _id;

    // A unique, deterministic string hash.
    // Issues with identical id values are considered identical.
    this.id = function() {
        if (_id) return _id;

        _id = this.type;

        if (this.hash) {   // subclasses can pass in their own differentiator
            _id += this.hash;
        }

        // factor in the entities this issue is for
        // (sort them so the id is deterministic)
        var entityKeys = this.entities.map(osmEntity.key);
        _id += entityKeys.sort().join();

        // factor in loc since two separate issues can have an
        // idential type and entities, e.g. in crossing_ways
        if (this.loc) {
            _id += this.loc.join();
        }
        return _id;
    };


    this.extent = function(resolver) {
        if (this.loc) {
            return geoExtent(this.loc);
        }
        if (this.entities && this.entities.length) {
            return this.entities.reduce(function(extent, entity) {
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

import { dispatch as d3_dispatch } from 'd3-dispatch';

import _isFunction from 'lodash-es/isFunction';
import _map from 'lodash-es/map';
import _filter from 'lodash-es/filter';
import _flatten from 'lodash-es/flatten';
import _flattenDeep from 'lodash-es/flattenDeep';
import _uniq from 'lodash-es/uniq';
import _uniqWith from 'lodash-es/uniqWith';
import { osmEntity } from '../osm';

import { utilRebind } from '../util/rebind';
import * as Validations from '../validations/index';

export function coreValidator(context) {
    var dispatch = d3_dispatch('reload'),
        self = {},
        issues = [],
        issuesByEntityId = {};

    var validations = _filter(Validations, _isFunction).reduce(function(obj, validation) {
        var func = validation();
        obj[func.type] = func;
        return obj;
    }, {});

    var entityValidationIds = [],
        changesValidationIds = [];

    for (var key in validations) {
        var validation = validations[key];
        if (validation.inputType && validation.inputType === 'changes') {
            changesValidationIds.push(key);
        } else {
            entityValidationIds.push(key);
        }
    }

    self.featureApplicabilityOptions = ['edited', 'all'];

    var featureApplicability = context.storage('issue-features') || 'edited';

    self.getFeatureApplicability = function() {
        return featureApplicability;
    };

    self.setFeatureApplicability = function(applicability) {
        featureApplicability = applicability;
        context.storage('issue-features', applicability);
    };

    self.getIssues = function() {
        return issues;
    };

    self.getWarnings = function() {
        return issues.filter(function(issue) {
            return issue.severity === 'warning';
        });
    };
    self.getErrors = function() {
        return issues.filter(function(issue) {
            return issue.severity === 'error';
        });
    };

    self.getIssuesForEntityWithID = function(entityID) {
        if (!context.hasEntity(entityID)) {
            return [];
        }
        if (!issuesByEntityId[entityID]) {
            var entity = context.entity(entityID);
            issuesByEntityId[entityID] = validateEntity(entity);
        }
        return issuesByEntityId[entityID];
    };

    function validateEntity(entity) {
        var issues = [];
        var ranValidations = new Set([]);
        // runs validation and appends resulting issues, returning true if validation passed
        function runValidation(type) {
            if (!ranValidations.has(type)) {
                var fn = validations[type];
                var typeIssues = fn(entity, context);
                issues = issues.concat(typeIssues);
                ranValidations.add(type);
                return typeIssues.length === 0;
            }
            return true;
        }

        if (entity.type === 'relation') {
            if (!runValidation('old_multipolygon')) {
                // don't flag missing tags if they are on the outer way
                ranValidations.add('missing_tag');
            }
        }

        // other validations require feature to be tagged
        if (!runValidation('missing_tag')) return issues;
        if (entity.type === 'way') {
            // only check for disconnected way if no almost junctions
            if (runValidation('almost_junction')) {
                runValidation('disconnected_way');
            } else {
                ranValidations.add('disconnected_way');
            }
            runValidation('crossing_ways');
            runValidation('tag_suggests_area');
        }
        // run all validations not yet run manually
        entityValidationIds.forEach(function(id) {
            runValidation(id);
        });
        return issues;
    }

    self.validate = function() {
        // clear cached issues
        issuesByEntityId = {};
        issues = [];

        var history = context.history();
        var changes = history.changes();
        var entitiesToCheck = changes.created.concat(changes.modified);
        var graph = history.graph();

        issues = _flatten(_map(changesValidationIds, function(ruleId) {
            var validation = validations[ruleId];
            return validation(changes, context);
        }));

        entitiesToCheck = _uniq(_flattenDeep(_map(entitiesToCheck, function(entity) {
            var entities = [entity];
            if (entity.type === 'node') {
                // validate ways if their nodes have changed
                entities = entities.concat(graph.parentWays(entity));
            }
            entities = _map(entities, function(entity) {
                if (entity.type !== 'relation') {
                    // validate relations if their geometries have changed
                    return [entity].concat(graph.parentRelations(entity));
                }
                return entity;
            });
            return entities;
        })));

        for (var entityIndex in entitiesToCheck) {
            var entity = entitiesToCheck[entityIndex];
            var entityIssues = validateEntity(entity);
            issuesByEntityId[entity.id] = entityIssues;
            issues = issues.concat(entityIssues);
        }
        issues = _uniqWith(issues, function(issue1, issue2) {
            return issue1.id() === issue2.id();
        });
        dispatch.call('reload', self, issues);
    };

    return utilRebind(self, dispatch, 'on');
}

export function validationIssue(attrs) {

    // A unique, deterministic string hash.
    // Issues with identical id values are considered identical.
    this.id = function () {
        var id = this.type;

        if (this.hash) {
            // subclasses can pass in their own differentiator
            id += this.hash;
        }

        // issue subclasses set the entity order but it must be deterministic
        var entityKeys = _map(this.entities, function(entity) {
            // use the key since it factors in the entity's local version
            return osmEntity.key(entity);
        });
        // factor in the entities this issue is for
        id += entityKeys.join();
        if (this.coordinates) {
            // factor in coordinates since two separate issues can have an
            // idential type and entities, e.g. in crossing_ways
            id += this.coordinates.join();
        }
        return id;
    };

    this.type = attrs.type;
    this.severity = attrs.severity;
    this.message = attrs.message;
    this.tooltip = attrs.tooltip;
    this.entities = attrs.entities;  // expect an array of entities
    this.coordinates = attrs.coordinates;  // expect a [lon, lat] array
    this.info = attrs.info; // an object containing arbitrary extra information
    this.fixes = attrs.fixes;  // expect an array of functions for possible fixes

    this.hash = attrs.hash; // an optional string to further differentiate the issue

    this.loc = function() {
        if (this.coordinates && Array.isArray(this.coordinates) && this.coordinates.length === 2) {
            return this.coordinates;
        }
        if (this.entities && this.entities.length > 0) {
            if (this.entities[0].loc) {
                return this.entities[0].loc;
            }
        }
    };

    if (this.fixes) {
        for (var i=0; i<this.fixes.length; i++) {
            // add a reference in the fix to the issue for use in fix actions
            this.fixes[i].issue = this;
        }
    }
}

export function validationIssueFix(attrs) {

    this.title = attrs.title;
    this.onClick = attrs.onClick;

    // the issue this fix is for
    this.issue = null;
}

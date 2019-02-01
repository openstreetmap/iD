import { dispatch as d3_dispatch } from 'd3-dispatch';

import _isObject from 'lodash-es/isObject';
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

export var ValidationIssueType = {
    deprecated_tag: 'deprecated_tag',
    disconnected_way: 'disconnected_way',
    many_deletions: 'many_deletions',
    missing_tag: 'missing_tag',
    old_multipolygon: 'old_multipolygon',
    tag_suggests_area: 'tag_suggests_area',
    maprules: 'maprules',
    crossing_ways: 'crossing_ways',
    almost_junction: 'almost_junction',
    generic_name: 'generic_name'
};

export var ValidationIssueSeverity = {
    warning: 'warning',
    error: 'error',
};

export function coreValidator(context) {
    var dispatch = d3_dispatch('reload'),
        self = {},
        issues = [],
        issuesByEntityId = {};

    var validations = _filter(Validations, _isFunction).reduce(function(obj, validation) {
        var func = validation();
        if (!func.type) {
            throw new Error('Validation type not found: ' + validation);
        }
        obj[func.type] = func;
        return obj;
    }, {});

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

    var genericEntityValidations = [
       ValidationIssueType.deprecated_tag,
       ValidationIssueType.generic_name,
       ValidationIssueType.maprules,
       ValidationIssueType.old_multipolygon
    ];

    function validateEntity(entity) {
        var issues = [];
        // runs validation and appends resulting issues, returning true if validation passed
        function runValidation(type) {
            var fn = validations[type];
            var typeIssues = fn(entity, context);
            issues = issues.concat(typeIssues);
            return typeIssues.length === 0;
        }
        // other validations require feature to be tagged
        if (!runValidation(ValidationIssueType.missing_tag)) return issues;
        if (entity.type === 'way') {
            if (runValidation(ValidationIssueType.almost_junction)) {
                // only check for disconnected highway if no almost junctions
                runValidation(ValidationIssueType.disconnected_way);
            }
            runValidation(ValidationIssueType.crossing_ways);
            runValidation(ValidationIssueType.tag_suggests_area);
        }
        genericEntityValidations.forEach(function(fn) {
            runValidation(fn);
        })
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

        issues = issues.concat(validations.many_deletions(changes, context));

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

    if (!_isObject(attrs)) throw new Error('Input attrs is not an object');
    if (!attrs.type || !ValidationIssueType.hasOwnProperty(attrs.type)) {
        throw new Error('Invalid attrs.type: ' + attrs.type);
    }
    if (!attrs.severity || !ValidationIssueSeverity.hasOwnProperty(attrs.severity)) {
        throw new Error('Invalid attrs.severity: ' + attrs.severity);
    }
    if (!attrs.message) throw new Error('attrs.message is empty');

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

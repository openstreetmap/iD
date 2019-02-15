import _isFunction from 'lodash-es/isFunction';
import _map from 'lodash-es/map';
import _filter from 'lodash-es/filter';
import _flatten from 'lodash-es/flatten';
import _flattenDeep from 'lodash-es/flattenDeep';
import _uniq from 'lodash-es/uniq';
import _uniqWith from 'lodash-es/uniqWith';

import { dispatch as d3_dispatch } from 'd3-dispatch';

import { geoExtent } from '../geo';
import { osmEntity } from '../osm';
import { utilRebind } from '../util/rebind';
import * as Validations from '../validations/index';


export function coreValidator(context) {
    var dispatch = d3_dispatch('reload');
    var self = {};
    var _issues = [];
    var _issuesByEntityID = {};

    var validations = _filter(Validations, _isFunction).reduce(function(obj, validation) {
        var func = validation();
        obj[func.type] = func;
        return obj;
    }, {});

    var entityValidationIDs = [];
    var changesValidationIDs = [];

    for (var key in validations) {
        var validation = validations[key];
        if (validation.inputType && validation.inputType === 'changes') {
            changesValidationIDs.push(key);
        } else {
            entityValidationIDs.push(key);
        }
    }

    //self.featureApplicabilityOptions = ['edited', 'all'];

    /*var featureApplicability = context.storage('issue-features') || 'edited';

    self.getFeatureApplicability = function() {
        return featureApplicability;
    };

    self.setFeatureApplicability = function(applicability) {
        featureApplicability = applicability;
        context.storage('issue-features', applicability);
    };*/

    self.getIssues = function() {
        return _issues;
    };

    self.getWarnings = function() {
        return _issues.filter(function(d) { return d.severity === 'warning'; });
    };

    self.getErrors = function() {
        return _issues.filter(function(d) { return d.severity === 'error'; });
    };

    self.getIssuesForEntityWithID = function(entityID) {
        if (!context.hasEntity(entityID)) return [];
        var entity = context.entity(entityID);
        var key = osmEntity.key(entity);

        if (!_issuesByEntityID[key]) {
            _issuesByEntityID[key] = validateEntity(entity);
        }
        return _issuesByEntityID[key];
    };


    function validateEntity(entity) {
        var _issues = [];
        var ran = {};

        // runs validation and appends resulting issues, returning true if validation passed
        function runValidation(which) {
            if (ran[which]) return true;

            var fn = validations[which];
            var typeIssues = fn(entity, context);
            _issues = _issues.concat(typeIssues);
            ran[which] = true;   // mark this validation as having run
            return !typeIssues.length;
        }

        if (entity.type === 'relation') {
            if (!runValidation('old_multipolygon')) {
                // don't flag missing tags if they are on the outer way
                ran.missing_tag = true;
            }
        }

        // other validations require feature to be tagged
        if (!runValidation('missing_tag')) return _issues;

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

        // run all validations not yet run manually
        entityValidationIDs.forEach(runValidation);

        return _issues;
    }


    self.validate = function() {
        _issuesByEntityID = {};   // clear cached
        _issues = [];

        var history = context.history();
        var changes = history.changes();
        var entitiesToCheck = changes.created.concat(changes.modified);
        var graph = history.graph();

        _issues = _flatten(_map(changesValidationIDs, function(ruleID) {
            var validation = validations[ruleID];
            return validation(changes, context);
        }));

        entitiesToCheck = _uniq(_flattenDeep(_map(entitiesToCheck, function(entity) {
            var entities = [entity];
            if (entity.type === 'node') {  // validate ways if their nodes have changed
                entities = entities.concat(graph.parentWays(entity));
            }
            entities = _map(entities, function(entity) {
                if (entity.type !== 'relation') {  // validate relations if their geometries have changed
                    return [entity].concat(graph.parentRelations(entity));
                }
                return entity;
            });
            return entities;
        })));

        for (var entityIndex in entitiesToCheck) {
            var entity = entitiesToCheck[entityIndex];
            var entityIssues = validateEntity(entity);
            _issuesByEntityID[entity.id] = entityIssues;
            _issues = _issues.concat(entityIssues);
        }

        _issues = _uniqWith(_issues, function(issue1, issue2) {
            return issue1.id() === issue2.id();
        });

        dispatch.call('reload', self, _issues);
    };

    return utilRebind(self, dispatch, 'on');
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

    // A unique, deterministic string hash.
    // Issues with identical id values are considered identical.
    this.id = function() {
        var id = this.type;

        if (this.hash) {   // subclasses can pass in their own differentiator
            id += this.hash;
        }

        // factor in the entities this issue is for
        // (sort them so the id is deterministic)
        var entityKeys = this.entities.map(osmEntity.key);
        id += entityKeys.sort().join();

        // factor in loc since two separate issues can have an
        // idential type and entities, e.g. in crossing_ways
        if (this.loc) {
            id += this.loc.join();
        }
        return id;
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

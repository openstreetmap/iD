import { dispatch as d3_dispatch } from 'd3-dispatch';

import _map from 'lodash-es/map';
import _flattenDeep from 'lodash-es/flattenDeep';
import _uniq from 'lodash-es/uniq';
import _uniqWith from 'lodash-es/uniqWith';

import { utilRebind } from '../util/rebind';

export function IssueManager(context) {
    var dispatch = d3_dispatch('reload'),
        self = {},
        issues = [],
        issuesByEntityId = {};

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

    self.getIssuesForEntityWithID = function(entityID) {
        if (!context.hasEntity(entityID)) {
            return [];
        }
        if (!issuesByEntityId[entityID]) {
            var entity = context.entity(entityID);
            issuesByEntityId[entityID] = context.history().validate([entity]);
        }
        return issuesByEntityId[entityID];
    };

    self.validate = function() {
        // clear cached issues
        issuesByEntityId = {};
        issues = [];

        var changes = context.history().changes();
        var entitiesToCheck = changes.created.concat(changes.modified);
        entitiesToCheck = _uniq(_flattenDeep(_map(entitiesToCheck, function(entity) {
            var entities = [entity];
            if (entity.type === 'node') {
                // validate ways if their nodes have changed
                entities = entities.concat(context.graph().parentWays(entity));
            }
            entities = _map(entities, function(entity) {
                if (entity.type !== 'relation') {
                    // validate relations if their geometries have changed
                    return [entity].concat(context.graph().parentRelations(entity));
                }
                return entity;
            });
            return entities;
        })));

        for (var entityIndex in entitiesToCheck) {
            var entity = entitiesToCheck[entityIndex];
            var entityIssues = context.history().validate([entity]);
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

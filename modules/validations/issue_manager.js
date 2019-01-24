import { dispatch as d3_dispatch } from 'd3-dispatch';

import _filter from 'lodash-es/filter';
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
        var changes = context.history().changes();
        var entitiesToCheck = changes.created.concat(changes.modified);
        issuesByEntityId = {};
        issues = [];
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

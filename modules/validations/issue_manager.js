import * as d3 from 'd3';

import _filter from 'lodash-es/filter';

import { utilRebind } from '../util/rebind';

export function IssueManager(context) {
    var dispatch = d3.dispatch('reload'),
        self = {},
        issues = [];

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
        var issues = self.getIssues();
        return _filter(issues, function(issue) {
            for (var i = 0; i < issue.entities.length; i++) {
                if (issue.entities[i].id === entityID) {
                    return true;
                }
            }
            return false;
        });
    };

    self.validate = function() {
        var changes = context.history().changes();
        issues = context.history().validate(changes);
        dispatch.call('reload', self, issues);
    };

    return utilRebind(self, dispatch, 'on');
}

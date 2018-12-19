import * as d3 from 'd3';
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
        self.validate();
        return issues;
    };

    self.validate = function() {
        var changes = context.history().changes();
        issues = context.history().validate(changes);
        dispatch.call('reload', self, issues);
    };

    return utilRebind(self, dispatch, 'on');
}

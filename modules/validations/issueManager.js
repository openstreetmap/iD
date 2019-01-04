import * as d3 from 'd3';

import _filter from 'lodash-es/filter';

import { utilRebind } from '../util/rebind';

export function IssueManager(context) {
    var dispatch = d3.dispatch('reload'),
        self = {},
        issues = [],
        ignore = [],
        customName,
        customUrl = '';

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

    self.setCustomName = function(name) {
        customName =  name;
    };

    self.getCustomName = function(){
        return customName;
    };

    self.getCustomUrl = function() {
        return customUrl;
    };

    self.setCustomUrl = function(url) {
        customUrl = url;
    };

    self.getSourceIssues = function(src) {
        self.validate();
        return _filter(issues, function(error){
            return error.source === src;
        });
    };

    self.removeSourceIgnore = function(src) {
        var index = ignore.indexOf(src);
        if (index !== -1){
            ignore.splice(index,1);
        }
    };

    self.ignoreSource = function(src) {
        ignore.push(src);
    };

    self.getIgnore = function() {
        return ignore;
    };

    self.ignoreIncludes = function(src) {
        return ignore.includes(src);
    }

    self.validate = function() {
        var changes = context.history().changes();
        issues = context.history().validate(changes);
        issues = _filter(issues, function(error){
            return !ignore.includes(error.source);
        });
        dispatch.call('reload', self, issues);
    };

    return utilRebind(self, dispatch, 'on');
}

import { services } from '../services';

export function validationMapCSSChecks() {
    var validation = function(entitiesToCheck, graph) {
        if (!services.maprules) return [];

        var rules = services.maprules.validationRules();
        var issues = [];

        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            for (var j = 0; j < entitiesToCheck.length; j++) {
                rule.findIssues(entitiesToCheck[j], graph, issues);
            }
        }

        return issues;
    };


    return validation;
}

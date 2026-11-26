import { services } from '../services';


export function validationMaprules() {
    var type = 'maprules';

    var validation = function checkMaprules(entity, graph) {
        if (!services.maprules) return [];

        var rules = services.maprules.validationRules();
        var issues = [];

        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            rule.findIssues(entity, graph, issues);
        }

        return issues;
    };


    validation.type = type;

    return validation;
}

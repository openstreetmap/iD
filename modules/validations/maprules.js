import { services } from '../services';


export function validationMaprules() {
    const type = 'maprules';

    const validation = function checkMaprules(entity, graph) {
        if (!services.maprules) return [];

        const rules = services.maprules.validationRules();
        const issues = [];

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            rule.findIssues(entity, graph, issues);
        }

        return issues;
    };


    validation.type = type;

    return validation;
}

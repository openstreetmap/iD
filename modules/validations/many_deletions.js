import { t } from '../util/locale';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
} from './validation_issue';

export function validationManyDeletions() {
    var threshold = 100;

    var validation = function(changes, graph) {
        var issues = [];
        var nodes=0, ways=0, areas=0, relations=0;

        changes.deleted.forEach(function(c) {
            if (c.type === 'node') {nodes++;}
            else if (c.type === 'way' && c.geometry(graph) === 'line') {ways++;}
            else if (c.type === 'way' && c.geometry(graph) === 'area') {areas++;}
            else if (c.type === 'relation') {relations++;}
        });
        if (changes.deleted.length > threshold) {
            issues.push(new validationIssue({
                type: ValidationIssueType.many_deletions,
                severity: ValidationIssueSeverity.warning,
                message: t(
                    'validations.many_deletions',
                    { n: changes.deleted.length, p: nodes, l: ways, a:areas, r: relations }
                ),
            }));
        }

        return issues;
    };


    return validation;
}

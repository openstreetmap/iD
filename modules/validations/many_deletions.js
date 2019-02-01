import { t } from '../util/locale';
import {
    validationIssue
} from '../core/validator';

export function validationManyDeletions() {

    var threshold = 100;

    var validation = function(changes, context) {
        var issues = [];
        var nodes = 0, ways = 0, areas = 0, relations = 0;
        var graph = context.graph();
        changes.deleted.forEach(function(c) {
            if (c.type === 'node') { nodes++; }
            else if (c.type === 'way' && c.geometry(graph) === 'line') { ways++; }
            else if (c.type === 'way' && c.geometry(graph) === 'area') { areas++; }
            else if (c.type === 'relation') { relations++; }
        });
        if (changes.deleted.length > threshold) {
            issues.push(new validationIssue({
                type: 'many_deletions',
                severity: 'warning',
                message: t(
                    'issues.many_deletions.message',
                    { n: changes.deleted.length, p: nodes, l: ways, a:areas, r: relations }
                ),
                tooltip: t('issues.many_deletions.tip'),
                hash: [nodes, ways, areas, relations].join()
            }));
        }

        return issues;
    };

    validation.type = 'many_deletions';
    validation.inputType = 'changes';

    return validation;
}

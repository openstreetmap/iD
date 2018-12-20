import _without from 'lodash-es/without';
import { t } from '../util/locale';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
} from './validation_issue';

export function validationMissingTag() {

    // Slightly stricter check than Entity#isUsed (#3091)
    function hasTags(entity, graph) {
        return _without(Object.keys(entity.tags), 'area', 'name').length > 0 ||
            graph.parentRelations(entity).length > 0;
    }

    var validation = function(changes, graph) {
        var types = ['point', 'line', 'area', 'relation'],
            issues = [];

        for (var i = 0; i < changes.created.length; i++) {
            var change = changes.created[i],
                geometry = change.geometry(graph);

            if (types.indexOf(geometry) !== -1 && !hasTags(change, graph)) {
                issues.push(new validationIssue({
                    type: ValidationIssueType.missing_tag,
                    severity: ValidationIssueSeverity.error,
                    message: t('issues.untagged_' + geometry + '.message'),
                    tooltip: t('issues.untagged_' + geometry + '.tooltip'),
                    entities: [change],
                }));
            }
        }

        return issues;
    };


    return validation;
}

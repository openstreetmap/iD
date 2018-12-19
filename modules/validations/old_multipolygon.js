import { t } from '../util/locale';
import { osmIsSimpleMultipolygonOuterMember } from '../osm';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
} from './validation_issue';

export function validationOldMultipolygon() {

    return function validation(changes, graph) {
        var issues = [];
        for (var i = 0; i < changes.created.length; i++) {
            var entity = changes.created[i];
            var parent = osmIsSimpleMultipolygonOuterMember(entity, graph);
            if (parent) {
                issues.push(new validationIssue({
                    type: ValidationIssueType.old_multipolygon,
                    severity: ValidationIssueSeverity.warning,
                    message: t('validations.old_multipolygon'),
                    tooltip: t('validations.old_multipolygon_tooltip'),
                    entities: [parent],
                }));
            }
        }
        return issues;
    };
}

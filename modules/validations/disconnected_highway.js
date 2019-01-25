import { t } from '../util/locale';
import {
    utilDisplayLabel
} from '../util';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
} from './validation_issue';


export function validationDisconnectedHighway(context) {

    function isDisconnectedHighway(entity, graph) {
        if (!entity.tags.highway) return false;
        if (entity.geometry(graph) !== 'line') return false;

        return graph.childNodes(entity)
            .every(function(vertex) {
                var parents = graph.parentWays(vertex);
                if (parents.length === 1) {  // standalone vertex
                    return true;
                } else {                     // shared vertex
                    return !vertex.tags.entrance &&
                        parents.filter(function(parent) {
                            return parent.tags.highway && parent !== entity;
                        }).length === 0;
                }
            });
    }


    var validation = function(entitiesToCheck, graph) {
        var issues = [];
        for (var i = 0; i < entitiesToCheck.length; i++) {
            var entity = entitiesToCheck[i];
            if (isDisconnectedHighway(entity, graph)) {
                var entityLabel = utilDisplayLabel(entity, context);
                issues.push(new validationIssue({
                    type: ValidationIssueType.disconnected_highway,
                    severity: ValidationIssueSeverity.warning,
                    message: t('issues.disconnected_highway.message', {highway: entityLabel}),
                    tooltip: t('issues.disconnected_highway.tip'),
                    entities: [entity],
                }));
            }
        }

        return issues;
    };


    return validation;
}

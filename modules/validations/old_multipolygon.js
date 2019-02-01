import { t } from '../util/locale';
import { osmIsSimpleMultipolygonOuterMember } from '../osm';
import { utilDisplayLabel } from '../util';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
    validationIssueFix
} from '../core/validator';
import {
    actionChangeTags
} from '../actions';

export function validationOldMultipolygon() {

    var validation = function(entity, context) {
        var issues = [];
        var graph = context.graph();
        var mistaggedMultipolygon = osmIsSimpleMultipolygonOuterMember(entity, graph);
        if (mistaggedMultipolygon) {
            var multipolygonLabel = utilDisplayLabel(mistaggedMultipolygon, context);
            issues.push(new validationIssue({
                type: ValidationIssueType.old_multipolygon,
                severity: ValidationIssueSeverity.warning,
                message: t('issues.old_multipolygon.message', {multipolygon: multipolygonLabel}),
                tooltip: t('issues.old_multipolygon.tip'),
                entities: [entity, mistaggedMultipolygon],
                fixes: [
                    new validationIssueFix({
                        title: t('issues.fix.move_tags.title'),
                        onClick: function() {
                            var outerWay = this.issue.entities[0];
                            var multipolygon =  this.issue.entities[1];
                            context.perform(
                                function(graph) {
                                    multipolygon = multipolygon.mergeTags(outerWay.tags);
                                    graph = graph.replace(multipolygon);
                                    graph = actionChangeTags(outerWay.id, {})(graph);
                                    return graph;
                                },
                                t('issues.fix.move_tags.undo_redo')
                            );
                        }
                    })
                ]
            }));
        }
        return issues;
    };

    validation.type = ValidationIssueType.old_multipolygon;

    return validation;
}

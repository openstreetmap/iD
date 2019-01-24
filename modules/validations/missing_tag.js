import _without from 'lodash-es/without';
import { t } from '../util/locale';
import {
    utilDisplayLabel
} from '../util';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
    validationIssueFix
} from './validation_issue';
import { operationDelete } from '../operations/index';

export function validationMissingTag(context) {

    // Slightly stricter check than Entity#isUsed (#3091)
    function hasTags(entity, graph) {
        return _without(Object.keys(entity.tags), 'area', 'name').length > 0 ||
            graph.parentRelations(entity).length > 0;
    }

    var validation = function(entitiesToCheck, graph) {
        var types = ['point', 'line', 'area', 'relation'];
        var issues = [];

        for (var i = 0; i < entitiesToCheck.length; i++) {
            var change = entitiesToCheck[i];
            var geometry = change.geometry(graph);

            if (types.indexOf(geometry) !== -1 && !hasTags(change, graph)) {
                var entityLabel = utilDisplayLabel(change, context);
                issues.push(new validationIssue({
                    type: ValidationIssueType.missing_tag,
                    severity: ValidationIssueSeverity.error,
                    message: t('issues.untagged_feature.message', {feature: entityLabel}),
                    tooltip: t('issues.untagged_feature.tooltip'),
                    entities: [change],
                    fixes: [
                        new validationIssueFix({
                            title: t('issues.fix.delete_feature.title'),
                            action: function() {
                                var id = this.issue.entities[0].id;
                                operationDelete([id], context)();
                            }
                        }),
                        new validationIssueFix({
                            title: t('issues.fix.select_preset.title'),
                            action: function() {
                                context.ui().sidebar.showPresetList();
                            }
                        })
                    ]
                }));
            }
        }

        return issues;
    };


    return validation;
}

import _without from 'lodash-es/without';
import { osmIsInterestingTag } from '../osm/tags';
import { t } from '../util/locale';
import {
    utilDisplayLabel
} from '../util';
import {
    validationIssue,
    validationIssueFix
} from '../core/validator';
import { operationDelete } from '../operations/index';

export function validationMissingTag() {

    function hasDescriptiveTags(entity) {
        var keys = _without(Object.keys(entity.tags), 'area', 'name').filter(osmIsInterestingTag);
        if (entity.type === 'relation' && keys.length === 1) {
            return entity.tags.type !== 'multipolygon';
        }
        return keys.length > 0;
    }

    var type = 'missing_tag';

    var validation = function(entity, context) {
        var types = ['point', 'line', 'area', 'relation'];
        var issues = [];
        var graph = context.graph();
        var geometry = entity.geometry(graph);
        // ignore vertex features
        if (types.indexOf(geometry) !== -1 &&
            !(hasDescriptiveTags(entity) || entity.hasParentRelations(graph))) {
            var entityLabel = utilDisplayLabel(entity, context);
            issues.push(new validationIssue({
                type: type,
                // error if created or modified, else warning
                severity: !entity.version || entity.v  ? 'error' : 'warning',
                message: t('issues.missing_tag.message', { feature: entityLabel }),
                tooltip: t('issues.missing_tag.tip'),
                entities: [entity],
                fixes: [
                    new validationIssueFix({
                        title: t('issues.fix.select_preset.title'),
                        onClick: function() {
                            context.ui().sidebar.showPresetList();
                        }
                    }),
                    new validationIssueFix({
                        title: t('issues.fix.delete_feature.title'),
                        onClick: function() {
                            var id = this.issue.entities[0].id;
                            operationDelete([id], context)();
                        }
                    })
                ]
            }));
        }

        return issues;
    };

    validation.type = type;

    return validation;
}

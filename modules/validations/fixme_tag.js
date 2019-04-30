import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue } from '../core/validation';


export function validationFixmeTag() {
    var type = 'fixme_tag';


    var validation = function checkFixmeTag(entity, context) {

        if (!entity.tags.fixme) return [];

        // don't flag fixmes on features added by the user
        if (entity.version === undefined) return [];

        if (entity.v !== undefined) {
            var baseEntity = context.history().base().hasEntity(entity.id);
            // don't flag fixmes added by the user on existing features
            if (!baseEntity || !baseEntity.tags.fixme) return [];
        }

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.fixme_tag.message', { feature: utilDisplayLabel(entity, context) }),
            reference: showReference,
            entityIds: [entity.id]
        })];

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.fixme_tag.reference'));
        }
    };

    validation.type = type;

    return validation;
}

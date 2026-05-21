import { actionChangeTags } from '../actions/change_tags';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import { osmLifecycleConflictPrefixes } from '../osm/tags';

export function validationLifecyclePrefixConflict() {
    const type = 'lifecycle_prefix_conflict';

    const validation = function checkLifecyclePrefixConflict(entity) {
        const pairsFound = [];

        Object.keys(entity.tags).forEach((key) => {
            const colonIndex = key.indexOf(':');
            if (colonIndex === -1) return;

            const prefix = key.slice(0, colonIndex);
            const baseKey = key.slice(colonIndex + 1);

            if (!osmLifecycleConflictPrefixes.has(prefix)) return;
            if (!(baseKey in entity.tags)) return;

            pairsFound.push([key, baseKey]);
        });

        return pairsFound.map((pair) => {
            return new validationIssue({
                type: type,
                severity: 'error',
                message: function(context) {
                    const entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t.append('issues.lifecycle_prefix_conflict.message', {
                        feature: utilDisplayLabel(entity, context.graph()),
                        tag1: pair[0],
                        tag2: pair[1]
                    }) : '';
                },
                reference: (selection) => showReference(selection, pair),
                entityIds: [entity.id],
                dynamicFixes: () => pair.slice(0, 2).map((tagToRemove) => createIssueFix(tagToRemove))
            });
        });

        function createIssueFix(tagToRemove) {
            return new validationIssueFix({
                icon: 'iD-operation-delete',
                title: t.append('issues.fix.remove_named_tag.title', { tag: tagToRemove }),
                onClick: function(context) {
                    const entityId = this.issue.entityIds[0];
                    const entity = context.entity(entityId);
                    const tags = Object.assign({}, entity.tags);
                    delete tags[tagToRemove];
                    context.perform(
                        actionChangeTags(entityId, tags),
                        t('issues.fix.remove_named_tag.annotation', { tag: tagToRemove })
                    );
                }
            });
        }

        function showReference(selection, pair) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.lifecycle_prefix_conflict.reference', {
                    tag1: pair[0],
                    tag2: pair[1]
                }));
        }
    };

    validation.type = type;
    return validation;
}

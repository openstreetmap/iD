import { actionChangeTags } from '../actions/change_tags';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationMisplacedTag() {
    var type = 'misplaced_tag';

    function isCrossingWay(entity) {
        return entity.type === 'way' && (
            entity.tags.footway === 'crossing' ||
            entity.tags.cycleway === 'crossing' ||
            entity.tags.path === 'crossing'
        );
    }

    var validation = function checkMisplacedTag(entity /*, graph */) {
        if (!isCrossingWay(entity) || !entity.tags.traffic_calming) return [];

        return [new validationIssue({
            type: type,
            subtype: 'traffic_calming_on_crossing_way',
            severity: 'warning',
            message: function(context) {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t.append('issues.misplaced_tag.traffic_calming_on_crossing_way.message', {
                    feature: utilDisplayLabel(entity, context.graph())
                }) : '';
            },
            reference: showReference,
            entityIds: [entity.id],
            dynamicFixes: function() {
                return [new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t.append('issues.fix.remove_named_tag.title', { tag: 'traffic_calming' }),
                    onClick: function(context) {
                        var entityId = this.issue.entityIds[0];
                        var entity = context.entity(entityId);
                        var tags = Object.assign({}, entity.tags);  // shallow copy
                        delete tags.traffic_calming;
                        context.perform(
                            actionChangeTags(entityId, tags),
                            t('issues.fix.remove_named_tag.annotation', { tag: 'traffic_calming' })
                        );
                    }
                })];
            }
        })];
    };

    validation.type = type;

    return validation;

    function showReference(selection) {
        selection.selectAll('.issue-reference')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'issue-reference')
            .call(t.append('issues.misplaced_tag.traffic_calming_on_crossing_way.reference'));
    }
}

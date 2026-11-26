import { actionCollapseSimpleMultipolygon } from '../actions/collapse_simple_multipolygon';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import type { osmWay } from '../osm';
import type { CreateValidator, Validator } from '../core/validation/models';

/**
 * Warns when a multipolygon has a closed way as its only member, for example after
 * its outer way was split and closed again. The fix turns it into a basic area:
 * the way keeps its id and the relation is deleted. #12643
 */
export const validationSimpleMultipolygon: CreateValidator = () => {
    const type = 'simple_multipolygon';

    const validation: Validator = function checkSimpleMultipolygon(entity, graph) {
        let way: osmWay | undefined;
        if (entity.type === 'way') {
            way = entity;
        } else if (entity.type === 'relation' && entity.isMultipolygon() && entity.members.length === 1) {
            const member = graph.hasEntity(entity.members[0].id);
            if (member?.type === 'way') way = member;
        }
        if (!way) return [];

        const wayID = way.id;
        const multipolygon = actionCollapseSimpleMultipolygon(wayID).multipolygon(graph);
        if (!multipolygon) return [];

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: function(context) {
                const relation = context.hasEntity(this.entityIds[0]);
                return relation ? t.append('issues.simple_multipolygon.message', {
                    feature: utilDisplayLabel(relation, context.graph())
                }) : '';
            },
            reference: showReference,
            // the same issue is found from the relation and from its way
            entityIds: [multipolygon.id, wayID],
            dynamicFixes: function() {
                return [new validationIssueFix({
                    icon: 'iD-icon-area',
                    title: t.append('issues.fix.convert_to_basic_area.title'),
                    onClick: function(context) {
                        context.perform(
                            actionCollapseSimpleMultipolygon(wayID),
                            t('issues.fix.convert_to_basic_area.annotation')
                        );
                    }
                })];
            }
        })];
    };


    function showReference(selection: d3.Selection) {
        selection.selectAll('.issue-reference')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'issue-reference')
            .call(t.append('issues.simple_multipolygon.reference'));
    }

    validation.type = type;

    return validation;
};

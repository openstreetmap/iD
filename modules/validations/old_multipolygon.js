import { t } from '../util/locale';
import { actionChangeTags } from '../actions/change_tags';
import { osmIsOldMultipolygonOuterMember, osmOldMultipolygonOuterMemberOfRelation } from '../osm/multipolygon';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationOldMultipolygon() {
    var type = 'old_multipolygon';


    var validation = function checkOldMultipolygon(entity, context) {
        var graph = context.graph();

        var multipolygon, outerWay;
        if (entity.type === 'relation') {
            outerWay = osmOldMultipolygonOuterMemberOfRelation(entity, graph);
            multipolygon = entity;
        } else if (entity.type === 'way') {
            multipolygon = osmIsOldMultipolygonOuterMember(entity, graph);
            outerWay = entity;
        } else {
            return [];
        }

        if (!multipolygon || !outerWay) return [];

        var multipolygonLabel = utilDisplayLabel(multipolygon, context);
        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.old_multipolygon.message', { multipolygon: multipolygonLabel }),
            reference: showReference,
            entities: [outerWay, multipolygon],
            fixes: [
                new validationIssueFix({
                    autoArgs: [doUpgrade, t('issues.fix.move_tags.annotation')],
                    title: t('issues.fix.move_tags.title'),
                    onClick: function() {
                        context.perform(doUpgrade, t('issues.fix.move_tags.annotation'));
                    }
                })
            ]
        })];


        function doUpgrade(graph) {
            multipolygon = multipolygon.mergeTags(outerWay.tags);
            graph = graph.replace(multipolygon);
            return actionChangeTags(outerWay.id, {})(graph);
        }


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.old_multipolygon.reference'));
        }
    };


    validation.type = type;

    return validation;
}

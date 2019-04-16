import { t } from '../util/locale';
import { actionChangeTags } from '../actions';
import { osmIsOldMultipolygonOuterMember, osmOldMultipolygonOuterMemberOfRelation } from '../osm';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


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
                    auto: true,
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
                            t('issues.fix.move_tags.annotation')
                        );
                    }
                })
            ]
        })];


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.old_multipolygon.tip'));
        }
    };


    validation.type = type;

    return validation;
}

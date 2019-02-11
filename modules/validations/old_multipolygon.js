import { t } from '../util/locale';

import { actionChangeTags } from '../actions';
import { osmIsOldMultipolygonOuterMember, osmOldMultipolygonOuterMemberOfRelation } from '../osm';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationOldMultipolygon() {
    var type = 'old_multipolygon';


    var validation = function(entity, context) {
        var issues = [];
        var graph = context.graph();

        var multipolygon, outerWay;
        if (entity.type === 'relation') {
            outerWay = osmOldMultipolygonOuterMemberOfRelation(entity, graph);
            multipolygon = entity;
        } else if (entity.type === 'way') {
            multipolygon = osmIsOldMultipolygonOuterMember(entity, graph);
            outerWay = entity;
        } else {
            return issues;
        }

        if (multipolygon && outerWay) {
            var multipolygonLabel = utilDisplayLabel(multipolygon, context);
            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: t('issues.old_multipolygon.message', { multipolygon: multipolygonLabel }),
                tooltip: t('issues.old_multipolygon.tip'),
                entities: [outerWay, multipolygon],
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
                                t('issues.fix.move_tags.annotation')
                            );
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

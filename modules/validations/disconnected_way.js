import { t } from '../util/locale';
import { modeDrawLine } from '../modes';
import { operationDelete } from '../operations/index';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationDisconnectedWay() {

    function isDisconnectedHighway(entity, graph) {
        if (!entity.tags.highway) return false;
        if (entity.geometry(graph) !== 'line') return false;

        return graph.childNodes(entity)
            .every(function(vertex) {
                var parents = graph.parentWays(vertex);
                if (parents.length === 1) {  // standalone vertex
                    return true;
                } else {                     // shared vertex
                    return !vertex.tags.entrance &&
                        parents.filter(function(parent) {
                            return parent.tags.highway && parent !== entity;
                        }).length === 0;
                }
            });
    }

    var type = 'disconnected_way';

    var validation = function(entity, context) {
        var issues = [];
        var graph = context.graph();
        if (isDisconnectedHighway(entity, graph)) {
            var entityLabel = utilDisplayLabel(entity, context);

            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: t('issues.disconnected_way.highway.message', { highway: entityLabel }),
                tooltip: t('issues.disconnected_way.highway.tip'),
                entities: [entity],
                fixes: [
                    new validationIssueFix({
                        title: t('issues.fix.continue_from_start.title'),
                        onClick: function() {
                            var way = this.issue.entities[0];
                            var vertex = context.entity(way.nodes[0]);
                            continueDrawing(way, vertex, context);
                        },
                        entityIds: [entity.nodes[0]]
                    }),
                    new validationIssueFix({
                        title: t('issues.fix.continue_from_end.title'),
                        onClick: function() {
                            var way = this.issue.entities[0];
                            var vertex = context.entity(way.nodes[way.nodes.length-1]);
                            continueDrawing(way, vertex, context);
                        },
                        entityIds: [entity.nodes[entity.nodes.length-1]]
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

    function continueDrawing(way, vertex, context) {

        if (!context.map().editable() ||
            !context.map().extent().contains(vertex.loc)) {
            // make sure the vertex is actually visible and editable
            context.map().zoomToEase(vertex);
        }

        context.enter(
            modeDrawLine(context, way.id, context.graph(), way.affix(vertex.id), true)
        );
    }

    validation.type = type;

    return validation;
}

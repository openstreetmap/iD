import { t } from '../util/locale';
import { modeDrawLine } from '../modes';
import { operationDelete } from '../operations/index';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationDisconnectedWay() {
    var type = 'disconnected_way';


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


    var validation = function(entity, context) {
        var issues = [];
        var graph = context.graph();

        if (isDisconnectedHighway(entity, graph)) {
            var entityLabel = utilDisplayLabel(entity, context);
            var fixes = [];

            if (!entity.isClosed()) {
                var first = context.entity(entity.first());
                if (first.tags.noexit !== 'yes') {
                    fixes.push(new validationIssueFix({
                        icon: 'iD-operation-continue-left',
                        title: t('issues.fix.continue_from_start.title'),
                        entityIds: [entity.first()],
                        onClick: function() {
                            var vertex = context.entity(entity.first());
                            continueDrawing(entity, vertex, context);
                        }
                    }));
                }
                var last = context.entity(entity.last());
                if (last.tags.noexit !== 'yes') {
                    fixes.push(new validationIssueFix({
                        icon: 'iD-operation-continue',
                        title: t('issues.fix.continue_from_end.title'),
                        entityIds: [entity.last()],
                        onClick: function() {
                            var vertex = context.entity(entity.last());
                            continueDrawing(entity, vertex, context);
                        }
                    }));
                }
            }

            fixes.push(new validationIssueFix({
                icon: 'iD-operation-delete',
                title: t('issues.fix.delete_feature.title'),
                entityIds: [entity.id],
                onClick: function() {
                    var id = this.issue.entities[0].id;
                    operationDelete([id], context)();
                }
            }));

            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: t('issues.disconnected_way.highway.message', { highway: entityLabel }),
                tooltip: t('issues.disconnected_way.highway.tip'),
                entities: [entity],
                fixes: fixes
            }));
        }

        return issues;


        function continueDrawing(way, vertex) {
            // make sure the vertex is actually visible and editable
            var map = context.map();
            if (!map.editable() || !map.trimmedExtent().contains(vertex.loc)) {
                map.zoomToEase(vertex);
            }

            context.enter(
                modeDrawLine(context, way.id, context.graph(), context.graph(), way.affix(vertex.id), true)
            );
        }
    };


    validation.type = type;

    return validation;
}

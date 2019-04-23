import { t } from '../util/locale';
import { modeDrawLine } from '../modes';
import { operationDelete } from '../operations/index';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validator';


export function validationDisconnectedWay() {
    var type = 'disconnected_way';

    var highways = {
        residential: true, service: true, track: true, unclassified: true, footway: true,
        path: true, tertiary: true, secondary: true, primary: true, living_street: true,
        cycleway: true, trunk: true, steps: true, motorway: true, motorway_link: true,
        pedestrian: true, trunk_link: true, primary_link: true, secondary_link: true,
        road: true, tertiary_link: true, bridleway: true, raceway: true, corridor: true,
        bus_guideway: true
    };

    function isTaggedAsHighway(entity) {
        return highways[entity.tags.highway];
    }


    var validation = function checkDisconnectedWay(entity, context) {
        var graph = context.graph();

        if (!isTaggedAsHighway(entity)) return [];
        if (!isDisconnectedWay(entity) && !isDisconnectedMultipolygon(entity)) return [];

        var entityLabel = utilDisplayLabel(entity, context);
        var fixes = [];
        var entityID = entity.id;
        var firstID = entity.first();
        var lastID = entity.last();

        if (entity.type === 'way' && !entity.isClosed()) {
            var first = context.entity(firstID);
            if (first.tags.noexit !== 'yes') {
                fixes.push(new validationIssueFix({
                    icon: 'iD-operation-continue-left',
                    title: t('issues.fix.continue_from_start.title'),
                    entityIds: [firstID],
                    onClick: function() {
                        var way = context.entity(entityID);
                        var vertex = context.entity(firstID);
                        continueDrawing(way, vertex, context);
                    }
                }));
            }
            var last = context.entity(lastID);
            if (last.tags.noexit !== 'yes') {
                fixes.push(new validationIssueFix({
                    icon: 'iD-operation-continue',
                    title: t('issues.fix.continue_from_end.title'),
                    entityIds: [lastID],
                    onClick: function() {
                        var way = context.entity(entityID);
                        var vertex = context.entity(lastID);
                        continueDrawing(way, vertex, context);
                    }
                }));
            }
        }

        if (!operationDelete([entity.id], context).disabled()) {
            fixes.push(new validationIssueFix({
                icon: 'iD-operation-delete',
                title: t('issues.fix.delete_feature.title'),
                entityIds: [entity.id],
                onClick: function() {
                    var id = this.issue.entities[0].id;
                    var operation = operationDelete([id], context);
                    if (!operation.disabled()) {
                        operation();
                    }
                }
            }));
        }

        return [new validationIssue({
            type: type,
            severity: 'warning',
            message: t('issues.disconnected_way.highway.message', { highway: entityLabel }),
            reference: showReference,
            entities: [entity],
            fixes: fixes
        })];


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.disconnected_way.highway.reference'));
        }


        function vertexIsDisconnected(way, vertex, relation) {
            // can not accurately test vertices on tiles not downloaded from osm - #5938
            var osm = context.connection();
            if (osm && !osm.isDataLoaded(vertex.loc)) {
                return false;
            }

            var parents = graph.parentWays(vertex);

            // standalone vertex
            if (parents.length === 1) return true;

            // entrances are considered connected
            if (vertex.tags.entrance && vertex.tags.entrance !== 'no') return false;

            return !parents.some(function(parentWay) {
                if (parentWay === way) return false;   // ignore the way we're testing
                if (isTaggedAsHighway(parentWay)) return true;

                return graph.parentMultipolygons(parentWay).some(function(parentRelation) {
                    // ignore the relation we're testing, if any
                    if (relation && parentRelation === relation) return false;

                    return isTaggedAsHighway(parentRelation);
                });
            });
        }


        function isDisconnectedWay(entity) {
            if (entity.type !== 'way') return false;
            return graph.childNodes(entity).every(function(vertex) {
                return vertexIsDisconnected(entity, vertex);
            });
        }


        function isDisconnectedMultipolygon(entity) {
            if (entity.type !== 'relation' || !entity.isMultipolygon()) return false;

            return entity.members.every(function(member) {
                if (member.type !== 'way') return true;

                var way = graph.hasEntity(member.id);
                if (!way) return true;

                return graph.childNodes(way).every(function(vertex) {
                    return vertexIsDisconnected(way, vertex, entity);
                });
            });
        }

        function continueDrawing(way, vertex) {
            // make sure the vertex is actually visible and editable
            var map = context.map();
            if (!map.editable() || !map.trimmedExtent().contains(vertex.loc)) {
                map.zoomToEase(vertex);
            }

            context.enter(
                modeDrawLine(context, way.id, context.graph(), context.graph(), 'line', way.affix(vertex.id), true)
            );
        }
    };


    validation.type = type;

    return validation;
}

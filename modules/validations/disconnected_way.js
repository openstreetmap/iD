import { t, localizer } from '../core/localizer';
import { modeDrawLine } from '../modes/draw_line';
import { operationDelete } from '../operations/delete';
import { utilDisplayLabel } from '../util';
import { osmRoutableHighwayTagValues } from '../osm/tags';
import { validationIssue, validationIssueFix } from '../core/validation';
import { services } from '../services';

export function validationDisconnectedWay() {
    var type = 'disconnected_way';

    function isTaggedAsHighway(entity) {
        return osmRoutableHighwayTagValues[entity.tags.highway];
    }

    var validation = function checkDisconnectedWay(entity, graph) {

        var routingIslandWays = routingIslandForEntity(entity);
        if (!routingIslandWays) return [];

        return [new validationIssue({
            type: type,
            subtype: 'highway',
            severity: 'warning',
            message: function(context) {
                if (this.entityIds.length === 1) {
                    var entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t('issues.disconnected_way.highway.message', { highway: utilDisplayLabel(entity, context.graph()) }) : '';
                }
                return t('issues.disconnected_way.routable.message.multiple', { count: this.entityIds.length.toString() });
            },
            reference: showReference,
            entityIds: Array.from(routingIslandWays).map(function(way) { return way.id; }),
            dynamicFixes: makeFixes
        })];


        function makeFixes(context) {

            var fixes = [];

            var singleEntity = this.entityIds.length === 1 && context.hasEntity(this.entityIds[0]);

            if (singleEntity) {

                if (singleEntity.type === 'way' && !singleEntity.isClosed()) {

                    var textDirection = localizer.textDirection();

                    var startFix = makeContinueDrawingFixIfAllowed(textDirection, singleEntity.first(), 'start');
                    if (startFix) fixes.push(startFix);

                    var endFix = makeContinueDrawingFixIfAllowed(textDirection, singleEntity.last(), 'end');
                    if (endFix) fixes.push(endFix);
                }
                if (!fixes.length) {
                    fixes.push(new validationIssueFix({
                        title: t('issues.fix.connect_feature.title')
                    }));
                }

                fixes.push(new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t('issues.fix.delete_feature.title'),
                    entityIds: [singleEntity.id],
                    onClick: function(context) {
                        var id = this.issue.entityIds[0];
                        var operation = operationDelete(context, [id]);
                        if (!operation.disabled()) {
                            operation();
                        }
                    }
                }));
            } else {
                fixes.push(new validationIssueFix({
                    title: t('issues.fix.connect_features.title')
                }));
            }

            return fixes;
        }


        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.disconnected_way.routable.reference'));
        }

        function routingIslandForEntity(entity) {

            var routingIsland = new Set();  // the interconnected routable features
            var waysToCheck = [];           // the queue of remaining routable ways to traverse

            function queueParentWays(node) {
                graph.parentWays(node).forEach(function(parentWay) {
                    if (!routingIsland.has(parentWay) &&    // only check each feature once
                        isRoutableWay(parentWay, false)) {  // only check routable features
                        routingIsland.add(parentWay);
                        waysToCheck.push(parentWay);
                    }
                });
            }

            if (entity.type === 'way' && isRoutableWay(entity, true)) {

                routingIsland.add(entity);
                waysToCheck.push(entity);

            } else if (entity.type === 'node' && isRoutableNode(entity)) {

                routingIsland.add(entity);
                queueParentWays(entity);

            } else {
                // this feature isn't routable, cannot be a routing island
                return null;
            }

            while (waysToCheck.length) {
                var wayToCheck = waysToCheck.pop();
                var childNodes = graph.childNodes(wayToCheck);
                for (var i in childNodes) {
                    var vertex = childNodes[i];

                    if (isConnectedVertex(vertex)) {
                        // found a link to the wider network, not a routing island
                        return null;
                    }

                    if (isRoutableNode(vertex)) {
                        routingIsland.add(vertex);
                    }

                    queueParentWays(vertex);
                }
            }

            // no network link found, this is a routing island, return its members
            return routingIsland;
        }

        function isConnectedVertex(vertex) {
            // assume ways overlapping unloaded tiles are connected to the wider road network  - #5938
            var osm = services.osm;
            if (osm && !osm.isDataLoaded(vertex.loc)) return true;

            // entrances are considered connected
            if (vertex.tags.entrance &&
                vertex.tags.entrance !== 'no') return true;
            if (vertex.tags.amenity === 'parking_entrance') return true;

            return false;
        }

        function isRoutableNode(node) {
            // treat elevators as distinct features in the highway network
            if (node.tags.highway === 'elevator') return true;
            return false;
        }

        function isRoutableWay(way, ignoreInnerWays) {
            if (isTaggedAsHighway(way) || way.tags.route === 'ferry') return true;

            return graph.parentRelations(way).some(function(parentRelation) {
                if (parentRelation.tags.type === 'route' &&
                    parentRelation.tags.route === 'ferry') return true;

                if (parentRelation.isMultipolygon() &&
                    isTaggedAsHighway(parentRelation) &&
                    (!ignoreInnerWays || parentRelation.memberById(way.id).role !== 'inner')) return true;
            });
        }

        function makeContinueDrawingFixIfAllowed(textDirection, vertexID, whichEnd) {
            var vertex = graph.hasEntity(vertexID);
            if (!vertex || vertex.tags.noexit === 'yes') return null;

            var useLeftContinue = (whichEnd === 'start' && textDirection === 'ltr') ||
                (whichEnd === 'end' && textDirection === 'rtl');

            return new validationIssueFix({
                icon: 'iD-operation-continue' + (useLeftContinue ? '-left' : ''),
                title: t('issues.fix.continue_from_' + whichEnd + '.title'),
                entityIds: [vertexID],
                onClick: function(context) {
                    var wayId = this.issue.entityIds[0];
                    var way = context.hasEntity(wayId);
                    var vertexId = this.entityIds[0];
                    var vertex = context.hasEntity(vertexId);

                    if (!way || !vertex) return;

                    // make sure the vertex is actually visible and editable
                    var map = context.map();
                    if (!context.editable() || !map.trimmedExtent().contains(vertex.loc)) {
                        map.zoomToEase(vertex);
                    }

                    context.enter(
                        modeDrawLine(context, wayId, context.graph(), 'line', way.affix(vertexId), true)
                    );
                }
            });
        }

    };

    validation.type = type;

    return validation;
}

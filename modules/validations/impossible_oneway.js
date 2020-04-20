import { localizer } from '../core/localizer';
import { t } from '../core/localizer';
import { modeDrawLine } from '../modes/draw_line';
import { actionReverse } from '../actions/reverse';
import { utilDisplayLabel } from '../util';
import { osmFlowingWaterwayTagValues, osmOneWayTags, osmRoutableHighwayTagValues } from '../osm/tags';
import { validationIssue, validationIssueFix } from '../core/validation';
import { services } from '../services';

export function validationImpossibleOneway() {
    var type = 'impossible_oneway';

    var validation = function checkImpossibleOneway(entity, graph) {

        if (entity.type !== 'way' || entity.geometry(graph) !== 'line') return [];

        if (entity.isClosed()) return [];

        if (!typeForWay(entity)) return [];

        if (!isOneway(entity)) return [];

        var firstIssues = issuesForNode(entity, entity.first());
        var lastIssues = issuesForNode(entity, entity.last());

        return firstIssues.concat(lastIssues);

        function typeForWay(way) {
            if (way.geometry(graph) !== 'line') return null;

            if (osmRoutableHighwayTagValues[way.tags.highway]) return 'highway';
            if (osmFlowingWaterwayTagValues[way.tags.waterway]) return 'waterway';
            return null;
        }

        function isOneway(way) {
            if (way.tags.oneway === 'yes') return true;
            if (way.tags.oneway) return false;

            for (var key in way.tags) {
                if (osmOneWayTags[key] && osmOneWayTags[key][way.tags[key]]) {
                    return true;
                }
            }
            return false;
        }

        function nodeOccursMoreThanOnce(way, nodeID) {
            var occurences = 0;
            for (var index in way.nodes) {
                if (way.nodes[index] === nodeID) {
                    occurences += 1;
                    if (occurences > 1) return true;
                }
            }
            return false;
        }

        function isConnectedViaOtherTypes(way, node) {

            var wayType = typeForWay(way);

            if (wayType === 'highway') {
                // entrances are considered connected
                if (node.tags.entrance && node.tags.entrance !== 'no') return true;
                if (node.tags.amenity === 'parking_entrance') return true;
            } else if (wayType === 'waterway') {
                if (node.id === way.first()) {
                    // multiple waterways may start at the same spring
                    if (node.tags.natural === 'spring') return true;
                } else {
                    // multiple waterways may end at the same drain
                    if (node.tags.manhole === 'drain') return true;
                }
            }

            return graph.parentWays(node).some(function(parentWay) {
                if (parentWay.id === way.id) return false;

                if (wayType === 'highway') {

                    // allow connections to highway areas
                    if (parentWay.geometry(graph) === 'area' &&
                        osmRoutableHighwayTagValues[parentWay.tags.highway]) return true;

                    // count connections to ferry routes as connected
                    if (parentWay.tags.route === 'ferry') return true;

                    return graph.parentRelations(parentWay).some(function(parentRelation) {
                        if (parentRelation.tags.type === 'route' &&
                            parentRelation.tags.route === 'ferry') return true;

                        // allow connections to highway multipolygons
                        return parentRelation.isMultipolygon() && osmRoutableHighwayTagValues[parentRelation.tags.highway];
                    });
                } else if (wayType === 'waterway') {
                    // multiple waterways may start or end at a water body at the same node
                    if (parentWay.tags.natural === 'water' ||
                        parentWay.tags.natural === 'coastline') return true;
                }
                return false;
            });
        }

        function issuesForNode(way, nodeID) {

            var isFirst = nodeID === way.first();

            var wayType = typeForWay(way);

            // ignore if this way is self-connected at this node
            if (nodeOccursMoreThanOnce(way, nodeID)) return [];

            var osm = services.osm;
            if (!osm) return [];

            var node = graph.hasEntity(nodeID);

            // ignore if this node or its tile are unloaded
            if (!node || !osm.isDataLoaded(node.loc)) return [];

            if (isConnectedViaOtherTypes(way, node)) return [];

            var attachedWaysOfSameType = graph.parentWays(node).filter(function(parentWay) {
                if (parentWay.id === way.id) return false;
                return typeForWay(parentWay) === wayType;
            });

            // assume it's okay for waterways to start or end disconnected for now
            if (wayType === 'waterway' && attachedWaysOfSameType.length === 0) return [];

            var attachedOneways = attachedWaysOfSameType.filter(function(attachedWay) {
                return isOneway(attachedWay);
            });

            // ignore if the way is connected to some non-oneway features
            if (attachedOneways.length < attachedWaysOfSameType.length) return [];

            if (attachedOneways.length) {
                var connectedEndpointsOkay = attachedOneways.some(function(attachedOneway) {
                    if ((isFirst ? attachedOneway.first() : attachedOneway.last()) !== nodeID) return true;
                    if (nodeOccursMoreThanOnce(attachedOneway, nodeID)) return true;
                    return false;
                });
                if (connectedEndpointsOkay) return [];
            }

            var placement = isFirst ? 'start' : 'end',
                messageID = wayType + '.',
                referenceID = wayType + '.';

            if (wayType === 'waterway') {
                messageID += 'connected.' + placement;
                referenceID += 'connected';
            } else {
                messageID += placement;
                referenceID += placement;
            }

            return [new validationIssue({
                type: type,
                subtype: wayType,
                severity: 'warning',
                message: function(context) {
                    var entity = context.hasEntity(this.entityIds[0]);
                    return entity ? t('issues.impossible_oneway.' + messageID + '.message', {
                        feature: utilDisplayLabel(entity, context.graph())
                    }) : '';
                },
                reference: getReference(referenceID),
                entityIds: [way.id, node.id],
                dynamicFixes: function() {

                    var fixes = [];

                    if (attachedOneways.length) {
                        fixes.push(new validationIssueFix({
                            icon: 'iD-operation-reverse',
                            title: t('issues.fix.reverse_feature.title'),
                            entityIds: [way.id],
                            onClick: function(context) {
                                var id = this.issue.entityIds[0];
                                context.perform(actionReverse(id), t('operations.reverse.annotation'));
                            }
                        }));
                    }
                    if (node.tags.noexit !== 'yes') {
                        var textDirection = localizer.textDirection();
                        var useLeftContinue = (isFirst && textDirection === 'ltr') ||
                            (!isFirst && textDirection === 'rtl');
                        fixes.push(new validationIssueFix({
                            icon: 'iD-operation-continue' + (useLeftContinue ? '-left' : ''),
                            title: t('issues.fix.continue_from_' + (isFirst ? 'start' : 'end') + '.title'),
                            onClick: function(context) {
                                var entityID = this.issue.entityIds[0];
                                var vertexID = this.issue.entityIds[1];
                                var way = context.entity(entityID);
                                var vertex = context.entity(vertexID);
                                continueDrawing(way, vertex, context);
                            }
                        }));
                    }

                    return fixes;
                },
                loc: node.loc
            })];

            function getReference(referenceID) {
                return function showReference(selection) {
                    selection.selectAll('.issue-reference')
                        .data([0])
                        .enter()
                        .append('div')
                        .attr('class', 'issue-reference')
                        .text(t('issues.impossible_oneway.' + referenceID + '.reference'));
                };
            }
        }
    };

    function continueDrawing(way, vertex, context) {
        // make sure the vertex is actually visible and editable
        var map = context.map();
        if (!context.editable() || !map.trimmedExtent().contains(vertex.loc)) {
            map.zoomToEase(vertex);
        }

        context.enter(
            modeDrawLine(context, way.id, context.graph(), 'line', way.affix(vertex.id), true)
        );
    }

    validation.type = type;

    return validation;
}

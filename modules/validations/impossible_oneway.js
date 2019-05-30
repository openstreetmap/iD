import { t } from '../util/locale';
import { modeDrawLine } from '../modes/draw_line';
import { actionReverse } from '../actions/reverse';
import { utilDisplayLabel } from '../util';
import { osmFlowingWaterwayTagValues, osmOneWayTags, osmRoutableHighwayTagValues } from '../osm/tags';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationImpossibleOneway() {
    var type = 'impossible_oneway';

    function typeForWay(way, context) {
        if (way.geometry(context.graph()) !== 'line') return null;

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

    function continueDrawing(way, vertex, context) {
        // make sure the vertex is actually visible and editable
        var map = context.map();
        if (!map.editable() || !map.trimmedExtent().contains(vertex.loc)) {
            map.zoomToEase(vertex);
        }

        context.enter(
            modeDrawLine(context, way.id, context.graph(), context.graph(), 'line', way.affix(vertex.id))
        );
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

    function isConnectedViaOtherTypes(context, way, node) {

        var wayType = typeForWay(way, context);

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

        return context.graph().parentWays(node).some(function(parentWay) {
            if (parentWay.id === way.id) return false;

            if (wayType === 'highway') {

                // allow connections to highway areas
                if (parentWay.geometry(context.graph()) === 'area' &&
                    osmRoutableHighwayTagValues[parentWay.tags.highway]) return true;

                // count connections to ferry routes as connected
                if (parentWay.tags.route === 'ferry') return true;

                return context.graph().parentRelations(parentWay).some(function(parentRelation) {
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

    function issuesForNode(context, way, nodeID) {

        var isFirst = nodeID === way.first();

        var wayType = typeForWay(way, context);

        // ignore if this way is self-connected at this node
        if (nodeOccursMoreThanOnce(way, nodeID)) return [];

        var osm = context.connection();
        if (!osm) return [];

        var node = context.hasEntity(nodeID);

        // ignore if this node or its tile are unloaded
        if (!node || !osm.isDataLoaded(node.loc)) return [];

        if (isConnectedViaOtherTypes(context, way, node)) return [];

        var attachedWaysOfSameType = context.graph().parentWays(node).filter(function(parentWay) {
            if (parentWay.id === way.id) return false;
            return typeForWay(parentWay, context) === wayType;
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

        var fixes = [];

        if (attachedOneways.length) {
            fixes.push(new validationIssueFix({
                icon: 'iD-operation-reverse',
                title: t('issues.fix.reverse_feature.title'),
                entityIds: [way.id],
                onClick: function() {
                    var id = this.issue.entityIds[0];
                    context.perform(actionReverse(id), t('operations.reverse.annotation'));
                }
            }));
        }
        if (node.tags.noexit !== 'yes') {
            fixes.push(new validationIssueFix({
                icon: 'iD-operation-continue' + (isFirst ? '-left' : ''),
                title: t('issues.fix.continue_from_' + (isFirst ? 'start' : 'end') + '.title'),
                onClick: function() {
                    var entityID = this.issue.entityIds[0];
                    var vertexID = this.issue.entityIds[1];
                    var way = context.entity(entityID);
                    var vertex = context.entity(vertexID);
                    continueDrawing(way, vertex, context);
                }
            }));
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
            message: function() {
                var entity = context.hasEntity(this.entityIds[0]);
                return entity ? t('issues.impossible_oneway.' + messageID + '.message', {
                    feature: utilDisplayLabel(entity, context)
                }) : '';
            },
            reference: getReference(referenceID),
            entityIds: [way.id, node.id],
            fixes: fixes
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

    var validation = function checkImpossibleOneway(entity, context) {

        if (entity.type !== 'way' || entity.geometry(context.graph()) !== 'line') return [];

        if (entity.isClosed()) return [];

        if (!typeForWay(entity, context)) return [];

        if (!isOneway(entity)) return [];

        var firstIssues = issuesForNode(context, entity, entity.first());
        var lastIssues = issuesForNode(context, entity, entity.last());

        return firstIssues.concat(lastIssues);
    };


    validation.type = type;

    return validation;
}

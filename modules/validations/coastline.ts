import { localizer, t, type TextDirection } from '../core/localizer';
import { modeDrawLine } from '../modes/draw_line';
import { actionReverse } from '../actions/reverse';
import { operationDelete } from '../operations/delete';
import { geoLatToMeters, geoLonToMeters } from '../geo';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';
import { services } from '../services';
import type { CreateValidator, Validator } from '../core/validation/models';
import type { coreContext, coreGraph } from '../core';
import type { EntityId, NodeId, OsmEntity, osmNode, osmWay, WayId } from '../osm';
import type { Vec2 } from '../geo/vector';


export const validationCoastline: CreateValidator = (context) => {
    var type = 'coastline';

    // project lon/lat into meters so we can compare directions and winding
    var projection = function(loc: Vec2): Vec2 {
        return [geoLonToMeters(loc[0], loc[1]), geoLatToMeters(loc[1])];
    };


    function isCoastline(entity: OsmEntity): entity is osmWay {
        return entity.type === 'way' && entity.tags.natural === 'coastline';
    }


    function isCoastlineWay(way: osmWay) {
        return way.tags.natural === 'coastline';
    }


    const validation: Validator = function checkCoastline(entity, graph) {
        if (!isCoastline(entity)) return [];

        var issues = [];

        var disconnect = disconnectedIssue(entity, graph);
        if (disconnect) issues.push(disconnect);

        var orientation = orientationIssue(entity, graph);
        if (orientation) issues.push(orientation);

        return issues;
    };


    // `adjacentCoastlines()`   (private)
    // Returns the other coastline ways connected to the given node.
    //
    function adjacentCoastlines(graph: coreGraph, node: osmNode, selfId: EntityId): osmWay[] {
        return graph.parentWays(node).filter(function(way) {
            return way.id !== selfId && isCoastlineWay(way);
        });
    }


    // `disconnectedIssue()`   (private)
    // A coastline way should be part of a continuous line, so warn whenever
    // one of its ends is not connected to another coastline way.
    // (We can only be sure an end is disconnected when the data around it
    // has been downloaded - otherwise the coastline might continue beyond
    // the edge of the map.)
    //
    function disconnectedIssue(way: osmWay, graph: coreGraph): validationIssue | null {
        if (way.isClosed() || way.isDegenerate()) return null;

        var endpoints = [way.first(), way.last()];
        for (var i = 0; i < endpoints.length; i++) {
            var node = graph.entity<osmNode>(endpoints[i]);

            // if the data isn't loaded here, we can't know whether the
            // coastline actually continues past this point - skip it
            var osm = services.osm;
            if (osm && !osm.isDataLoaded(node.loc)) return null;

            if (adjacentCoastlines(graph, node, way.id).length === 0) {
                return new validationIssue({
                    type: type,
                    subtype: 'disconnect',
                    severity: 'warning',
                    message: function(context) {
                        var entity = context.hasEntity(this.entityIds[0]);
                        return entity ? t.append('issues.coastline.disconnect.message', {
                            feature: utilDisplayLabel(entity, context.graph())
                        }) : '';
                    },
                    reference: function(selection) {
                        selection.selectAll('.issue-reference')
                            .data([0])
                            .enter()
                            .append('div')
                            .attr('class', 'issue-reference')
                            .call(t.append('issues.coastline.disconnect.reference'));
                    },
                    entityIds: [way.id],
                    loc: node.loc,
                    hash: node.id,
                    dynamicFixes: makeDisconnectFixes
                });
            }
        }
        return null;
    }


    // `orientationIssue()`   (private)
    // Closed ways should follow the "right hand rule" (land on the left,
    // i.e. counterclockwise).  Open ways should be drawn in the same
    // direction as the coastline ways they connect to.
    //
    function orientationIssue(way: osmWay, graph: coreGraph): validationIssue | null {
        if (way.isDegenerate()) return null;

        if (way.isClosed()) {
            return ringOrientationIssue(way, graph);
        }
        return directionIssue(way, graph);
    }


    // `ringOrientationIssue()`   (private)
    // For a closed coastline (an island), the signed area of the ring
    // projected into meters tells us the winding order.  A positive area
    // means counterclockwise, which has the land on the left - correct.
    // A negative area means clockwise - warn.
    //
    function ringOrientationIssue(way: osmWay, graph: coreGraph): validationIssue | null {
        if (way.tags.area === 'yes') return null;  // treated as an area, winding is intentional

        var nodes = graph.childNodes(way);
        if (nodes.length < 4) return null;

        var sum = 0;
        for (var i = 0; i < nodes.length - 1; i++) {
            var a = projection(nodes[i].loc);
            var b = projection(nodes[i + 1].loc);
            sum += a[0] * b[1] - b[0] * a[1];
        }

        if (sum >= 0) return null;   // counterclockwise - land on the left

        return makeOrientationIssue(graph, way, 'orientation', way.first());
    }


    // `directionIssue()`   (private)
    // For an open coastline, the direction of the way should continue along
    // the direction of any adjacent coastline ways it connects to.  We
    // compare the direction of travel at each endpoint with the direction
    // of travel of the connecting coastline ways.  If they point in roughly
    // opposite directions (more than 120 degrees apart), one of them is
    // drawn backwards.
    //
    function directionIssue(way: osmWay, graph: coreGraph): validationIssue | null {
        var endpoints = [way.first(), way.last()];
        for (var i = 0; i < endpoints.length; i++) {
            var endpoint = endpoints[i];
            var node = graph.entity<osmNode>(endpoint);

            var direction = travelDirectionAt(graph, way, endpoint);
            if (!direction) continue;

            var adjacent = adjacentCoastlines(graph, node, way.id);
            for (var j = 0; j < adjacent.length; j++) {
                var other = adjacent[j];
                if (other.isDegenerate()) continue;

                var otherDirection = travelDirectionAt(graph, other, endpoint);
                if (!otherDirection) continue;

                // normalize so the dot product gives the angle between them
                var mag1 = Math.hypot(direction[0], direction[1]);
                var mag2 = Math.hypot(otherDirection[0], otherDirection[1]);
                if (!mag1 || !mag2) continue;
                var dot = (direction[0] * otherDirection[0] + direction[1] * otherDirection[1]) / (mag1 * mag2);

                // only warn for clear reversals, so that sharp but valid
                // turns (e.g. around a peninsula) aren't flagged
                if (dot >= -0.5) continue;

                // report from one side only so a single reversal produces a
                // single issue, no matter which way is validated first
                if (way.id >= other.id) continue;

                return makeOrientationIssue(graph, way, 'direction', endpoint, other.id);
            }
        }
        return null;
    }


    // `travelDirectionAt()`   (private)
    // Returns the direction of travel of an open way through a given node,
    // projected into meters.  For an endpoint this is the direction of the
    // segment leading into/out of the node; for an interior node it is the
    // direction between its two neighbours.
    //
    function travelDirectionAt(graph: coreGraph, way: osmWay, nodeId: NodeId): Vec2 | null {
        var nodes = way.nodes;
        var index = nodes.indexOf(nodeId);
        if (index === -1) return null;

        var prev = index > 0 ? nodes[index - 1] : null;
        var next = index < nodes.length - 1 ? nodes[index + 1] : null;

        var a, b;
        if (prev !== null && next !== null) {
            a = graph.entity<osmNode>(prev).loc;
            b = graph.entity<osmNode>(next).loc;
        } else if (next !== null) {
            a = graph.entity<osmNode>(nodeId).loc;
            b = graph.entity<osmNode>(next).loc;
        } else if (prev !== null) {
            a = graph.entity<osmNode>(prev).loc;
            b = graph.entity<osmNode>(nodeId).loc;
        } else {
            return null;
        }

        var p1 = projection(a);
        var p2 = projection(b);
        return [p2[0] - p1[0], p2[1] - p1[1]];
    }


    function makeOrientationIssue(graph: coreGraph, way: osmWay, subtype: string, loc: NodeId, otherId?: WayId): validationIssue {
        var entityIds = otherId ? [way.id, otherId] : [way.id];

        return new validationIssue({
            type: type,
            subtype: subtype,
            severity: 'warning',
            message: function(context) {
                var graph = context.graph();
                var entity1 = graph.hasEntity(this.entityIds[0]);
                var entity2 = this.entityIds[1] && graph.hasEntity(this.entityIds[1]);
                if (!entity1) return '';

                if (subtype === 'orientation') {
                    return t.append('issues.coastline.orientation.message', {
                        feature: utilDisplayLabel(entity1, graph)
                    });
                }
                return entity2 ? t.append('issues.coastline.direction.message', {
                    feature: utilDisplayLabel(entity1, graph),
                    feature2: utilDisplayLabel(entity2, graph)
                }) : '';
            },
            reference: function(selection) {
                selection.selectAll('.issue-reference')
                    .data([0])
                    .enter()
                    .append('div')
                    .attr('class', 'issue-reference')
                    .call(t.append('issues.coastline.' + subtype + '.reference'));
            },
            entityIds: entityIds,
            loc: graph.entity<osmNode>(loc).loc,
            hash: loc,
            dynamicFixes: makeReverseFixes
        });
    }


    // `makeReverseFixes()`   (private)
    // Offer to reverse the direction of each coastline way involved.
    //
    function makeReverseFixes(this: validationIssue, context: coreContext): validationIssueFix[] {
        return (this.entityIds || []).map(function(wayId) {
            var way = context.hasEntity(wayId);
            if (!way || way.type !== 'way') return null;

            return new validationIssueFix({
                icon: 'iD-operation-reverse',
                title: t.append('issues.fix.reverse_feature.informative_title', {
                    feature: utilDisplayLabel(way, context.graph())
                }),
                entityIds: [wayId],
                onClick: function() {
                    context.perform(
                        actionReverse(wayId),
                        t('operations.reverse.annotation.line', { n: 1 })
                    );
                }
            });
        }).filter(Boolean);
    }


    // `makeDisconnectFixes()`   (private)
    // Offer to continue drawing the coastline from either end, or to delete it.
    //
    function makeDisconnectFixes(this: validationIssue, context: coreContext): validationIssueFix[] {
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
                    title: t.append('issues.fix.connect_feature.title')
                }));
            }

            fixes.push(new validationIssueFix({
                icon: 'iD-operation-delete',
                title: t.append('issues.fix.delete_feature.title'),
                entityIds: [singleEntity.id],
                onClick: function(context) {
                    var id = this.issue!.entityIds[0];
                    var operation = operationDelete(context, [id]);
                    if (!operation.disabled()) {
                        operation();
                    }
                }
            }));
        } else {
            fixes.push(new validationIssueFix({
                title: t.append('issues.fix.connect_features_manually.title'),
                tooltip: t.append('issues.fix.connect_features_manually.tooltip'),
            }));
        }

        return fixes;
    }


    function makeContinueDrawingFixIfAllowed(textDirection: TextDirection, vertexID: NodeId, whichEnd: 'start' | 'end') {
        var vertex = context.hasEntity(vertexID);
        if (!vertex) return null;

        var useLeftContinue = (whichEnd === 'start' && textDirection === 'ltr') ||
            (whichEnd === 'end' && textDirection === 'rtl');

        return new validationIssueFix({
            icon: 'iD-operation-continue' + (useLeftContinue ? '-left' : ''),
            title: t.append('issues.fix.continue_from_' + whichEnd + '.title'),
            entityIds: [vertexID],
            onClick: function(context) {
                var wayId = this.issue!.entityIds[0] as WayId;
                var way = context.hasEntity(wayId);
                var vertexId = this.entityIds![0] as NodeId;
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


    validation.type = type;

    return validation;
};
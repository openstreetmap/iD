import _cloneDeep from 'lodash-es/cloneDeep';
import {
    geoExtent,
    geoLineIntersection,
    geoMetersToLat,
    geoMetersToLon,
    geoSphericalDistance,
    geoVecInterp,
    geoHasSelfIntersections,
    geoSphericalClosestNode
} from '../geo';
import {
    utilDisplayLabel
} from '../util';
import {
    actionAddMidpoint,
    actionChangeTags,
    actionMergeNodes
} from '../actions';
import { t } from '../util/locale';
import {
    validationIssue,
    validationIssueFix
} from '../core/validator';


/**
 * Look for roads that can be connected to other roads with a short extension
 */
export function validationAlmostJunction() {

    function isHighway(entity) {
        return entity.type === 'way' && entity.tags.highway && entity.tags.highway !== 'no';
    }
    function isNoexit(node) {
        return node.tags.noexit && node.tags.noexit === 'yes';
    }

    function findConnectableEndNodesByExtension(way, graph, tree) {
        var results = [],
            nidFirst = way.nodes[0],
            nidLast = way.nodes[way.nodes.length - 1],
            nodeFirst = graph.entity(nidFirst),
            nodeLast = graph.entity(nidLast);

        if (nidFirst === nidLast) return results;

        var testNodes;

        if (!isNoexit(nodeFirst) && graph.parentWays(nodeFirst).length === 1) {
            var connNearFirst = canConnectByExtend(way, 0, graph, tree);
            if (connNearFirst !== null) {
                testNodes = _cloneDeep(graph.childNodes(way));
                testNodes[0].loc = connNearFirst.cross_loc;
                // don't flag issue if connecting the ways would cause self-intersection
                if (!geoHasSelfIntersections(testNodes, nodeFirst.id)) {
                    results.push({
                        node: nodeFirst,
                        wid: connNearFirst.wid,
                        edge: connNearFirst.edge,
                        cross_loc: connNearFirst.cross_loc
                    });
                }
            }
        }
        if (!isNoexit(nodeLast) && graph.parentWays(nodeLast).length === 1) {
            var connNearLast = canConnectByExtend(way, way.nodes.length - 1, graph, tree);
            if (connNearLast !== null) {
                testNodes = _cloneDeep(graph.childNodes(way));
                testNodes[testNodes.length-1].loc = connNearLast.cross_loc;
                // don't flag issue if connecting the ways would cause self-intersection
                if (!geoHasSelfIntersections(testNodes, nodeLast.id)) {
                    results.push({
                        node: nodeLast,
                        wid: connNearLast.wid,
                        edge: connNearLast.edge,
                        cross_loc: connNearLast.cross_loc
                    });
                }
            }
        }
        return results;
    }

    function canConnectByExtend(way, endNodeIdx, graph, tree) {
        var EXTEND_TH_METERS = 5,
            tipNid = way.nodes[endNodeIdx],  // the 'tip' node for extension point
            midNid = endNodeIdx === 0 ? way.nodes[1] : way.nodes[way.nodes.length - 2],  // the other node of the edge
            tipNode = graph.entity(tipNid),
            midNode = graph.entity(midNid),
            lon = tipNode.loc[0],
            lat = tipNode.loc[1],
            lon_range = geoMetersToLon(EXTEND_TH_METERS, lat) / 2,
            lat_range = geoMetersToLat(EXTEND_TH_METERS) / 2,
            queryExtent = geoExtent([
                [lon - lon_range, lat - lat_range],
                [lon + lon_range, lat + lat_range]
            ]);

        // first, extend the edge of [midNode -> tipNode] by EXTEND_TH_METERS and find the "extended tip" location
        var edgeLen = geoSphericalDistance(midNode.loc, tipNode.loc),
            t = EXTEND_TH_METERS / edgeLen + 1.0,
            extTipLoc = geoVecInterp(midNode.loc, tipNode.loc, t);

        // then, check if the extension part [tipNode.loc -> extTipLoc] intersects any other ways
        var intersected = tree.intersects(queryExtent, graph);
        for (var i = 0; i < intersected.length; i++) {
            if (!isHighway(intersected[i]) || intersected[i].id === way.id) continue;
            var way2 = intersected[i];
            for (var j = 0; j < way2.nodes.length - 1; j++) {
                var nA = graph.entity(way2.nodes[j]),
                    nB = graph.entity(way2.nodes[j + 1]),
                    crossLoc = geoLineIntersection([tipNode.loc, extTipLoc], [nA.loc, nB.loc]);
                if (crossLoc !== null) {
                    return {
                        wid: way2.id,
                        edge: [nA.id, nB.id],
                        cross_loc: crossLoc
                    };
                }
            }
        }
        return null;
    }

    var type = 'almost_junction';

    var validation = function(endHighway, context) {

        if (!isHighway(endHighway)) return [];

        var graph = context.graph();
        var tree = context.history().tree();

        var issues = [];
        var extendableNodeInfos = findConnectableEndNodesByExtension(endHighway, graph, tree);
        extendableNodeInfos.forEach(function(extendableNodeInfo) {
            var node = extendableNodeInfo.node;
            var edgeHighway = graph.entity(extendableNodeInfo.wid);
            var fixes = [new validationIssueFix({
                title: t('issues.fix.connect_almost_junction.title'),
                onClick: function() {
                    var endNode = this.issue.entities[1],
                        targetEdge = this.issue.info.edge,
                        crossLoc = this.issue.info.cross_loc;
                    var edgeNodes = [context.graph().entity(targetEdge[0]), context.graph().entity(targetEdge[1])];
                    var closestNodeInfo = geoSphericalClosestNode(edgeNodes, crossLoc);
                    // if there is already a point nearby, just connect to that
                    if (closestNodeInfo.distance < 0.75) {
                        context.perform(
                            actionMergeNodes([closestNodeInfo.node.id, endNode.id], closestNodeInfo.node.loc),
                            t('issues.fix.connect_almost_junction.undo_redo')
                        );
                    // else add the end node to the edge way
                    } else {
                        context.perform(
                            actionAddMidpoint({loc: crossLoc, edge: targetEdge}, endNode),
                            t('issues.fix.connect_almost_junction.undo_redo')
                        );
                    }
                }
            })];
            if (Object.keys(node.tags).length === 0) {
                // node has no tags, suggest noexit fix
                fixes.push(new validationIssueFix({
                    title: t('issues.fix.tag_as_disconnected.title'),
                    onClick: function() {
                        var nodeID = this.issue.entities[1].id;
                        context.perform(
                            actionChangeTags(nodeID, {noexit: 'yes'}),
                            t('issues.fix.tag_as_disconnected.undo_redo')
                        );
                    }
                }));
            }
            issues.push(new validationIssue({
                type: type,
                severity: 'warning',
                message: t('issues.almost_junction.message', {
                    feature: utilDisplayLabel(endHighway, context),
                    feature2: utilDisplayLabel(edgeHighway, context)
                }),
                tooltip: t('issues.almost_junction.highway-highway.tip'),
                entities: [endHighway, node, edgeHighway],
                coordinates: extendableNodeInfo.node.loc,
                info: {
                    edge: extendableNodeInfo.edge,
                    cross_loc: extendableNodeInfo.cross_loc
                },
                fixes: fixes
            }));
        });

        return issues;
    };

    validation.type = type;

    return validation;
}

import {
    geoSphericalDistance
} from '../geo';

export function actionFollow(selectedIDs, projection, reverse = false, customGraph = null) {

    // tgt: target
    // src: source
    // cnt: count
    // idx: index

    /*var dist = function (nodeA, nodeB) {
        var locA = nodeA.loc;
        var locB = nodeB.loc;
        var epsilon = 1e-6;
        return (locA && locB) ? geoSphericalDistance(locA, locB) : epsilon;
    }*/

    var getStartNodeId = function (startNodeId, tgtNodes, srcNodes) {
        if (startNodeId) {
            return startNodeId;
        } else {
            for (var tgtI = 0, tgtNodesCnt = tgtNodes.length; tgtI < tgtNodesCnt; tgtI++) {
                var tgtNodeIdxInSrc = srcNodes.indexOf(tgtNodes[tgtI]);
                if (tgtNodeIdxInSrc >= 0) {
                    return tgtNodes[tgtI];
                }
            }
        }
        return null;
    };

    var getEndNodeId = function (startNodeId, endNodeId, tgtNodes, srcNodes) {
        if (endNodeId) {
            return endNodeId;
        } else {
            for (var tgtI = 0, tgtNodesCnt = tgtNodes.length; tgtI < tgtNodesCnt; tgtI++) {
                var tgtNodeIdxInSrc = srcNodes.indexOf(tgtNodes[tgtI]);
                if (tgtNodeIdxInSrc >= 0 && tgtNodes[tgtI] !== startNodeId) {
                    return tgtNodes[tgtI];
                }
            }
        }
        return null;
    };

    var action = function (graph) {
        window.graph = graph;
        window.entities = graph.entities;

        var tgtWay = graph.entity(selectedIDs[0]);
        var tgtWayIsClosed = tgtWay.isClosed();
        var tgtNodes = tgtWay.nodes.slice();
        var tgtNodesCnt = tgtNodes.length;
        var srcWay = graph.entity(selectedIDs[1]);
        var srcWayIsClosed = srcWay.isClosed();
        var srcNodes = srcWay.nodes.slice();
        var srcNodesCnt = srcNodes.length;


        var startNodeId = getStartNodeId(selectedIDs[2], tgtNodes, srcNodes);
        var endNodeId = getEndNodeId(startNodeId, selectedIDs[3], tgtNodes, srcNodes);

        var startNodeIdxInSrc = srcNodes.indexOf(startNodeId);
        var endNodeIdxInSrc = srcNodes.indexOf(endNodeId);
        var startNodeIdxInTgt = tgtNodes.indexOf(startNodeId);
        var endNodeIdxInTgt = tgtNodes.indexOf(endNodeId);

        if (startNodeIdxInTgt > endNodeIdxInTgt) { // make sure the start index in target is before the end so we can use the next node index in the loop
            [startNodeIdxInTgt, endNodeIdxInTgt] = [endNodeIdxInTgt, startNodeIdxInTgt];
        }

        if (startNodeIdxInSrc > endNodeIdxInSrc) { // make sure the start index in source is before the end so we can use the next node index in the loop
            [startNodeIdxInSrc, endNodeIdxInSrc] = [endNodeIdxInSrc, startNodeIdxInSrc];
        }

        //console.log('srcIsClosed', srcWay.isClosed());
        //console.log('tgtIsClosed', tgtWay.isClosed());
        //console.log('startNodeIdxInSrc', startNodeIdxInSrc);
        //console.log('endNodeIdxInSrc', endNodeIdxInSrc);
        //console.log('startNodeIdxInTgt', startNodeIdxInTgt);
        //console.log('endNodeIdxInTgt', endNodeIdxInTgt);
        //console.log('srcNodesBetweenF', srcWay.getNodesBetween(startNodeIdxInSrc, endNodeIdxInSrc));
        //console.log('srcNodesBetweenB', srcWay.getNodesBetween(endNodeIdxInSrc, startNodeIdxInSrc));
        //const tgtNodesBetweenForward = tgtWay.getNodesBetween(startNodeIdxInTgt, endNodeIdxInTgt);
        //const tgtNodesBetweenBackward = tgtWay.getNodesBetween(endNodeIdxInTgt, endNodeIdxInTgt);
        //console.log('tgtNodesBetweenF', tgtNodesBetweenForward);
        //console.log('tgtNodesBetweenB', tgtNodesBetweenBackward);
        let srcNodesUsed = srcWay.getNodesBetween(startNodeIdxInSrc, endNodeIdxInSrc);
        if (srcNodesUsed.length === 0) {
            console.error('no suitable nodes in source');
            return graph;
        }
        const srcNodesUsedReversed = [...srcNodesUsed].reverse(); // need to clone because reverse modifies the original array

        console.log('srcNodesUsed and reversed', srcNodesUsed, srcNodesUsedReversed);

        const updatedTgtWayNodes = [];
        if (!tgtWayIsClosed && !srcWayIsClosed) {
            let nodeIdx = 0;
            while(nodeIdx < startNodeIdxInTgt) {
                updatedTgtWayNodes.push(tgtNodes[nodeIdx]);
                nodeIdx++;
            }
            if (tgtNodes[startNodeIdxInTgt] === srcNodesUsed[0]) {
                updatedTgtWayNodes.push(...srcNodesUsed);
            } else {
                updatedTgtWayNodes.push(...srcNodesUsedReversed);
            }
            nodeIdx = endNodeIdxInTgt + 1;
            while(nodeIdx < tgtNodes.length) {
                updatedTgtWayNodes.push(tgtNodes[nodeIdx]);
                nodeIdx++;
            }
            // update target way:
            tgtWay = tgtWay.update({nodes: updatedTgtWayNodes});
            graph  = graph.replace(tgtWay);
            // remove unconnected tagless nodes in between:
            nodeIdx = startNodeIdxInTgt + 1;
            while(nodeIdx < endNodeIdxInTgt) {
                const node = graph.entity(tgtNodes[nodeIdx]);
                //console.log('checking node: ', node.id, graph.isShared(node), node.hasNonGeometryTags(), graph.parentWays(node).length);
                if (!node.hasNonGeometryTags() && !graph.isShared(node) && graph.parentWays(node).length === 0) {
                    console.log('removing node: ', node.id);
                    const deleteAction = iD.actionDeleteNode(node.id);
                    graph = deleteAction(graph);
                }
                nodeIdx++;
            }
        }

        return graph;
        
    };

    action.disabled = function (graph) {

        var tgtWay = graph.entity(selectedIDs[0]);
        var tgtNodes = tgtWay.nodes.slice();
        var srcWay = graph.entity(selectedIDs[1]);
        var srcNodes = srcWay.nodes.slice();
        var startNodeId = getStartNodeId(selectedIDs[2], tgtNodes, srcNodes);
        var endNodeId = getEndNodeId(startNodeId, selectedIDs[3], tgtNodes, srcNodes);
        var startNodeIdxInTgt = tgtNodes.indexOf(startNodeId);
        var endNodeIdxInTgt = tgtNodes.indexOf(endNodeId);
        var startNodeIdxInSrc = srcNodes.indexOf(startNodeId);
        var endNodeIdxInSrc = srcNodes.indexOf(endNodeId);
        // make sure the nodes are shared by source and target ways:
        if (startNodeIdxInTgt === -1 || endNodeIdxInTgt === -1 || startNodeIdxInSrc === -1 || endNodeIdxInSrc === -1) {
            return 'nodes_are_not_shared_by_both_ways';
        }
        if ((tgtWay.isClosed() && tgtNodes.length < 4) || (srcWay.isClosed() && srcNodes.length < 4)) { // must have at least two other node outside loop node which are repeated
            return 'source_or_target_way_is_closed_but_has_less_than_4_nodes';
        }
        /*if (Math.abs(startNodeIdxInTgt - endNodeIdxInTgt) !== 1 && (endNodeIdxInTgt !== tgtNodesCnt - 1 || startNodeIdxInTgt !== 0)) {
            return 'nodes_are_not_consecutive_in_target';
        }*/
        return false;

    };

    action.transitionable = true;

    return action;
}
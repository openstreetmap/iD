import { actionDeleteNode } from './delete_node';

/**
 * Snaps the first selected way onto the second way (the ways must have at least 2 common nodes)
 * If no nodes are selected, snaps between the first and the second common nodes
 * If one node is selected, snaps between the first common node and the selected node
 * If 2 nodes are selected, snaps between the first selected node and the second selected node
 * @param selectedIDs list with the IDs of the entities which are currently selected
 * @param reverse boolean that indicates in which direction to snap
 * @returns snap action
 */
export function actionSnap(selectedIDs, reverse = false) {

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

        let tgtWay = graph.entity(selectedIDs[0]);
        let tgtWayIsClosed = tgtWay.isClosed();
        let tgtNodes = tgtWay.nodes.slice();
        let srcWay = graph.entity(selectedIDs[1]);
        let srcNodes = srcWay.nodes.slice();

        let startNodeId = getStartNodeId(selectedIDs[2], tgtNodes, srcNodes);
        let endNodeId = getEndNodeId(startNodeId, selectedIDs[3], tgtNodes, srcNodes);

        let startNodeIdxInSrc = srcNodes.indexOf(startNodeId);
        let endNodeIdxInSrc = srcNodes.indexOf(endNodeId);
        let startNodeIdxInTgt = tgtNodes.indexOf(startNodeId);
        let endNodeIdxInTgt = tgtNodes.indexOf(endNodeId);

        // if target way is closed, create two unclosed lines from both side of the start and end nodes:
        let tgtSide1Nodes = [];
        let tgtSide2Nodes = [];
        if (tgtWayIsClosed) {
            tgtSide1Nodes = tgtWay.getNodesBetween(startNodeIdxInTgt, endNodeIdxInTgt);
            tgtSide2Nodes = tgtWay.getNodesBetween(endNodeIdxInTgt, startNodeIdxInTgt);
            tgtNodes = reverse ? tgtSide2Nodes : tgtSide1Nodes;
        }

        startNodeIdxInTgt = tgtNodes.indexOf(startNodeId);
        endNodeIdxInTgt = tgtNodes.indexOf(endNodeId);
        if (startNodeIdxInTgt > endNodeIdxInTgt) { // make sure the start index in target is before the end so we can use the next node index in the loop
            [startNodeIdxInTgt, endNodeIdxInTgt] = [endNodeIdxInTgt, startNodeIdxInTgt];
        }

        let srcNodesUsed = srcWay.getNodesBetween(startNodeIdxInSrc, endNodeIdxInSrc);
        const srcNodesUsedReversed = [...srcNodesUsed].reverse(); // need to clone because reverse modifies the original array

        const updatedTgtWayNodes = [];
        let nodeIdx = 0;
        while (nodeIdx < startNodeIdxInTgt) {
            updatedTgtWayNodes.push(tgtNodes[nodeIdx]);
            nodeIdx++;
        }
        if (tgtNodes[startNodeIdxInTgt] === srcNodesUsed[0]) {
            updatedTgtWayNodes.push(...srcNodesUsed);
        } else {
            updatedTgtWayNodes.push(...srcNodesUsedReversed);
        }
        nodeIdx = endNodeIdxInTgt + 1;
        while (nodeIdx < tgtNodes.length) {
            updatedTgtWayNodes.push(tgtNodes[nodeIdx]);
            nodeIdx++;
        }
        // update target way:
        if (!tgtWayIsClosed) {
            tgtWay = tgtWay.update({
                nodes: updatedTgtWayNodes
            });
        } else {
            let tgtSideToUpdate = 1;
            if (tgtWayIsClosed) {
                if (tgtSideToUpdate === 1) {
                    tgtSide2Nodes.shift(); // remove first node from tgt side 2, so it is not repeated. Only the last node will repeat and will be the looping node
                    const firstNodes = [...updatedTgtWayNodes];
                    const closedTgtWayNodes = firstNodes.concat(...tgtSide2Nodes);
                    tgtWay = tgtWay.update({
                        nodes: closedTgtWayNodes
                    });
                } else {
                    tgtSide1Nodes.shift(); // remove first node from tgt side 2, so it is not repeated. Only the last node will repeat and will be the looping node
                    const firstNodes = [...updatedTgtWayNodes];
                    const closedTgtWayNodes = firstNodes.concat(...tgtSide1Nodes);
                    tgtWay = tgtWay.update({
                        nodes: closedTgtWayNodes
                    });
                }
            }
        }
        graph = graph.replace(tgtWay);
        // remove unconnected tagless nodes in between:
        nodeIdx = startNodeIdxInTgt + 1;
        while (nodeIdx < endNodeIdxInTgt) {
            const node = graph.entity(tgtNodes[nodeIdx]);
            if (!node.hasNonGeometryTags() && !graph.isShared(node) && graph.parentWays(node).length === 0) {
                const deleteAction = actionDeleteNode(node.id);
                graph = deleteAction(graph);
            }
            nodeIdx++;
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
        var srcNodesUsed = srcWay.getNodesBetween(startNodeIdxInSrc, endNodeIdxInSrc);
        // make sure the nodes are shared by source and target ways:
        if (startNodeIdxInTgt === -1 || endNodeIdxInTgt === -1 || startNodeIdxInSrc === -1 || endNodeIdxInSrc === -1) {
            return 'nodes_are_not_shared_by_both_ways';
        }
        if ((tgtWay.isClosed() && tgtNodes.length < 4) || (srcWay.isClosed() && srcNodes.length < 4)) { // must have at least two other node outside loop node which are repeated
            return 'source_or_target_way_is_closed_but_has_less_than_4_nodes';
        }
        if (srcNodesUsed.length === 0) {
            return 'no_suitable_nodes_in_source';
        }

        return false;

    };

    action.transitionable = true;

    return action;
}

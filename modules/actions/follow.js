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

        if (startNodeIdxInTgt > endNodeIdxInTgt) { // make sure the start index in target is before the end target so we can use the next node index in the loop
            var tmpEndNodeIdxInTgt = endNodeIdxInTgt;
            startNodeIdxInTgt = endNodeIdxInTgt;
            endNodeIdxInTgt = tmpEndNodeIdxInTgt;
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
            srcNodesUsed = srcWay.getNodesBetween(endNodeIdxInSrc, startNodeIdxInSrc);
        }
        if (srcNodesUsed.length === 0) {
            return graph;
        }
        const srcNodesUsedReversed = [...srcNodesUsed].reverse(); // need to clone because reverse modifies the original array

        console.log('srcNodesUsed', srcNodesUsed);

        const updatedTgtWayNodes = [];
        if (!tgtWayIsClosed) {
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
            /*while(nodeIdx < endNodeIdxInTgt) {
                const node = graph.entity(tgtNodes[nodeIdx]);
                if (!node.hasNonGeometryTags() && !node.isConnected(graph)) {
                    console.log('removing node: ', node.id);
                    const deleteAction = iD.actionDeleteNode(node.id);
                    graph = deleteAction(graph);
                }
                nodeIdx++;
            }*/
        }
        console.log('updatedTgtWayNodes', updatedTgtWayNodes);

        return graph;
        //const tgtNodesBetweenForwardCnt = tgtNodesBetweenForward.length;
        //const tgtNodesBetweenBackwardCnt = tgtNodesBetweenBackward.length;

        let tgtNodesBetween = reverse && tgtWayIsClosed ? tgtNodesBetweenBackward : tgtNodesBetweenForward;

        const tgtNodesBetweenCnt = tgtNodesBetween.length;
        const newTgtNodes = [];
        // ignore action if any node in target is connected between start and end:
        for (let i = 0; i < tgtNodesBetweenCnt; i++) {
            if (graph.entity(tgtNodesBetween[i]).isConnected(graph)) {
                console.log('found connected in target, ignoring follow action');
                return graph;
            }
        }
        if (tgtWayIsClosed && startNodeIdxInTgt > endNodeIdxInTgt) { // this means the looping node is between start and end, so we must move the looping node
            newTgtNodes.push(tgtNodes[startNodeIdxInTgt]); // start node will now be the looping node
            for (let i = endNodeIdxInTgt; i < tgtNodesCnt; i++) {
                if (i <= startNodeIdxInTgt) {
                    newTgtNodes.push(tgtNodes[i]);
                }
            }
            newTgtNodes.push(tgtNodes[i]); // add back the end node as new looping node
            startNodeIdxInTgt = tgtNodes.length - 1;
            endNodeIdxInTgt = 0;
        } else if (tgtWayIsClosed && startNodeIdxInTgt > endNodeIdxInTgt) {
            for (let i = 0; i < tgtNodesCnt; i++) {
                if (i >= startNodeIdxInTgt && i <= endNodeIdxInTgt) {
                    newTgtNodes.push(tgtNodes[i]);
                }
            }
            newTgtNodes.push(tgtNodes[i]); // add back the end node as new looping node
            startNodeIdxInTgt = 0;
            endNodeIdxInTgt = 1;
        }




        if (newTgtNodes[startNodeIdxInTgt] === srcNodes[startNodeIdxInSrc]) {

        }

        return graph;

        if (!tgtWayIsClosed && startNodeIdxInTgt > endNodeIdxInTgt) { // make sure the start index in target is before the end target so we can use the next node index in the loop
            var tmpEndNodeIdxInTgt = endNodeIdxInTgt;
            startNodeIdxInTgt = endNodeIdxInTgt;
            endNodeIdxInTgt = tmpEndNodeIdxInTgt;
        }


        let srcUsedNodes = [];
        // if source way is not closed, there is only one possible direction, find it:
        if (!srcWayIsClosed) {
            if (startNodeIdxInSrc > endNodeIdxInSrc) { // wrong direction, use backward
                // reverse target start and end nodes:
                var tmpEndNodeIdx = startNodeIdxInTgt;
                startNodeIdxInTgt = endNodeIdxInTgt;
                endNodeIdxInTgt = tmpEndNodeIdx;

                // fetch source used nodes (nodes to follow in the source way):
                let srcNodeIdx = startNodeIdxInSrc;
                srcUsedNodes.push(srcNodes[srcNodeIdx]);
                const maxLoopCount = 1000;
                let loopCount = 0;
                while (srcNodeIdx !== endNodeIdxInSrc) {
                    if (loopCount >= maxLoopCount) {
                        console.error('while loop to find prev (not closed) node is infinite. Stopping...');
                        break;
                    }
                    const prevSrcNodeIdx = srcWay.prevNodeIdx(srcNodeIdx);
                    console.log('prevNotClosedSrcNodeIdx', prevSrcNodeIdx, loopCount);
                    srcUsedNodes.push(srcNodes[prevSrcNodeIdx]);
                    srcNodeIdx = prevSrcNodeIdx;
                    loopCount++;
                }
            }
        } else if (reverse) { // source way is closed and reverse is true
            let srcNodeIdx = startNodeIdxInSrc;
            srcUsedNodes.push(srcNodes[srcNodeIdx]);
            const maxLoopCount = 1000;
            let loopCount = 0;
            while (srcNodes[srcNodeIdx] !== srcNodes[endNodeIdxInSrc]) { // here we need to check for the node ids, since the first and last of closed way have two different indexes (0 and length-1)
                if (loopCount >= maxLoopCount) {
                    console.error('while loop to find prev node (closed and reverse) is infinite. Stopping...');
                    break;
                }
                const prevSrcNodeIdx = srcWay.prevNodeIdx(srcNodeIdx);
                console.log('prevSrcNodeIdx', prevSrcNodeIdx, loopCount);
                srcUsedNodes.push(srcNodes[prevSrcNodeIdx]);
                srcNodeIdx = prevSrcNodeIdx;
                loopCount++;
            }
        } else { // source way is closed and reverse is false
            let srcNodeIdx = startNodeIdxInSrc;
            srcUsedNodes.push(srcNodes[srcNodeIdx]);
            const maxLoopCount = 1000;
            let loopCount = 0;
            console.log('lastNodeIdx', srcNodes.length - 1);
            while (srcNodes[srcNodeIdx] !== srcNodes[endNodeIdxInSrc]) { // here we need to check for the node ids, since the first and last of closed way have two different indexes (0 and length-1)
                if (loopCount >= maxLoopCount) {
                    console.error('while loop to find next node (closed not reverse) is infinite. Stopping...');
                    break;
                }
                const nextSrcNodeIdx = srcWay.nextNodeIdx(srcNodeIdx)
                console.log('nextSrcNodeIdx', nextSrcNodeIdx, loopCount);
                srcUsedNodes.push(srcNodes[nextSrcNodeIdx]);
                srcNodeIdx = nextSrcNodeIdx;
                loopCount++;
            }
        }

        console.log('srcUsedNodes', srcUsedNodes);
        const srcUsedNodesCnt = srcUsedNodes.length;

        if (tgtWayIsClosed) {
            let newTgtNodes = [];
            let tgtNodeIdx = 0;
            while(tgtNodes[tgtNodeIdx] != tgtNodes[startNodeIdxInTgt]) {
                newTgtNodes.push(tgtNodes[tgtNodeIdx]);
                tgtNodeIdx++;
            }
            // main loop
            while(tgtNodes[tgtNodeIdx] != tgtNodes[endNodeIdxInTgt]) {
                newTgtNodes.push(tgtNodes[tgtNodeIdx]);
                tgtNodeIdx++;
            }
        } else {
            let newTgtNodes = [];
            let tgtNodeIdx = 0;
            while(tgtNodeIdx <= startNodeIdxInTgt) {
                newTgtNodes.push(tgtNodes[tgtNodeIdx]);
                tgtNodeIdx++;
            }
            // main loop
            while(tgtNodeIdx <= endNodeIdxInTgt) {
                newTgtNodes.push(tgtNodes[tgtNodeIdx]);
                tgtNodeIdx++;
            }
        }

        // if src way is closed and end node id is the last, choose the first point instead (index 0), which would be the same node id.
        //endNodeIdxInSrc = srcWayIsClosed && startNodeIdxInSrc > endNodeIdxInSrc && endNodeIdxInSrc === srcNodesCnt - 1 ? 0 : endNodeIdxInSrc;

        // for each connected node in target way, find nearest node in source used nodes:


        /*if (!srcWayIsClosed && startNodeIdxInSrc > endNodeIdxInSrc) { // reverse direction for src if backward
            var tmpStartNodeIdx   = startNodeIdxInSrc;
                startNodeIdxInSrc = endNodeIdxInSrc;
                endNodeIdxInSrc   = tmpStartNodeIdx;
        }
        if (!tgtWayIsClosed && !srcWayIsClosed && startNodeIdxInTgt > endNodeIdxInTgt) { // reverse direction for src if backward
            var tmpEndNodeIdx     = startNodeIdxInTgt;
                startNodeIdxInTgt = endNodeIdxInTgt;
                endNodeIdxInTgt   = tmpEndNodeIdx;
        }
        // check if target is closed and if start and end target nodes are the last segment of the loop :
        var tgtIsLastSegmentOfClosedWay = tgtWayIsClosed && ((startNodeIdxInTgt === 0 && endNodeIdxInTgt === tgtNodesCnt - 2) || (endNodeIdxInTgt === 0 && startNodeIdxInTgt === tgtNodesCnt - 2));
        var sameDirection               = srcNodes[startNodeIdxInSrc] === tgtNodes[startNodeIdxInTgt];
        var newTgtNodes = tgtNodes;

        var insertIdx  = endNodeIdxInTgt;
        var srcNodeIdx = srcWayIsClosed && startNodeIdxInSrc === srcNodesCnt - 2 ? 0 : startNodeIdxInSrc + 1;
        var srcIndexIncrement = sameDirection ? 1 : 0;

        if (srcWayIsClosed)
        {
            var tgtDirectionAsc   = endNodeIdxInTgt > startNodeIdxInTgt;
                srcIndexIncrement = tgtDirectionAsc ? 1 : 0;
                insertIdx         = tgtDirectionAsc ? endNodeIdxInTgt : startNodeIdxInTgt;
            if (tgtIsLastSegmentOfClosedWay) {
                insertIdx = tgtNodesCnt - 1;
                srcIndexIncrement = tgtDirectionAsc ? 0 : 1;
            }
        }
        else
        {
            if (tgtIsLastSegmentOfClosedWay) {
                insertIdx = tgtNodesCnt - 1;
                srcIndexIncrement = 0;
            }
        }*/

        /*const newTgNodes = [];
        const tgtNodesCount = tgtNodes.length;
        for (let tgtNodeI = 0; tgtNodeI < tgtNodesCount; tgtNodeI++) {
            if (tgtNodeI <= startNodeIdxInTgt || tgtNodeI >= endNodeIdxInTgt) { // before or after start/end nodes
                newTgNodes.push(tgtNodes[tgtNodeI]);
            } else { // between start and end node
                let minDistanceSrcNodeLoc = null;
                let minDistance = Infinity;
                while (srcNodeIdx < endNodeIdxInSrc) { // if node is connected, snap to nearest in source:
                    const distance = dist(tgtNodes[tgtNodeI], srcNodes[srcNodeIdx])
                    srcNodeIdx++;
                }
            }
        }*/

        /*while (srcNodeIdx !== endNodeIdxInSrc)
        {

        }

        while (srcNodeIdx !== endNodeIdxInSrc)
        {
            newTgtNodes.splice(insertIdx, 0, srcNodes[srcNodeIdx]);
            insertIdx = insertIdx + srcIndexIncrement;
             // jump to the first node if source is closed:
            srcNodeIdx = srcWayIsClosed && srcNodeIdx + 1 === srcNodesCnt - 1 ? 0 : srcNodeIdx + 1; 
        }
        tgtWay = tgtWay.update({nodes: newTgtNodes});
        graph  = graph.replace(tgtWay);*/
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
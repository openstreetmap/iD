export function actionFollow(selectedIDs) {

    // tgt: target
    // src: source
    // cnt: count
    // idx: index

    var getStartNodeId = function(startNodeId, tgtNodes, srcNodes) {
        if (startNodeId) {
            return startNodeId;
        } else {
            for (var tgtI = 0, tgtNodesCnt = tgtNodes.length; tgtI < tgtNodesCnt; tgtI++) {
                var tgtNodeIdxInSrc = srcNodes.indexOf(tgtNodes[tgtI]);
                if (tgtNodeIdxInSrc >= 0)
                {
                    return tgtNodes[tgtI];
                }
            }
        }
        return null;
    };

    var getEndNodeId = function(startNodeId, endNodeId, tgtNodes, srcNodes) {
        if (endNodeId) {
            return endNodeId;
        } else {
            for (var tgtI = 0, tgtNodesCnt = tgtNodes.length; tgtI < tgtNodesCnt; tgtI++) {
                var tgtNodeIdxInSrc = srcNodes.indexOf(tgtNodes[tgtI]);
                if (tgtNodeIdxInSrc >= 0 && tgtNodes[tgtI] !== startNodeId)
                {
                    return tgtNodes[tgtI];
                }
            }
        }
        return null;
    };

    var action = function(graph) {

        var tgtWay         = graph.entity(selectedIDs[0]);
        var tgtWayIsClosed = tgtWay.isClosed();
        var tgtNodes       = tgtWay.nodes.slice();
        var tgtNodesCnt    = tgtNodes.length;
        var srcWay         = graph.entity(selectedIDs[1]);
        var srcWayIsClosed = srcWay.isClosed();
        var srcNodes       = srcWay.nodes.slice();
        var srcNodesCnt    = srcNodes.length;

        var startNodeId = getStartNodeId(selectedIDs[2], tgtNodes, srcNodes);
        var endNodeId   = getEndNodeId(startNodeId, selectedIDs[3], tgtNodes, srcNodes);

        var startNodeIdxInSrc = srcNodes.indexOf(startNodeId);
        var endNodeIdxInSrc   = srcNodes.indexOf(endNodeId);

        var startNodeIdxInTgt = tgtNodes.indexOf(startNodeId);
        var endNodeIdxInTgt   = tgtNodes.indexOf(endNodeId);

        
        if (!srcWayIsClosed && startNodeIdxInSrc > endNodeIdxInSrc) { // reverse direction for src if backward
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
        }

        while (srcNodeIdx !== endNodeIdxInSrc)
        {
            newTgtNodes.splice(insertIdx, 0, srcNodes[srcNodeIdx]);
            insertIdx = insertIdx + srcIndexIncrement;
             // jump to the first node if source is closed:
            srcNodeIdx = srcWayIsClosed && srcNodeIdx + 1 === srcNodesCnt - 1 ? 0 : srcNodeIdx + 1; 
        }
       
        tgtWay = tgtWay.update({nodes: newTgtNodes});
        graph  = graph.replace(tgtWay);

        return graph;
    };

    action.disabled = function(graph) {

        var tgtWay         = graph.entity(selectedIDs[0]);
        var tgtWayIsClosed = tgtWay.isClosed();
        var tgtNodes       = tgtWay.nodes.slice();
        var tgtNodesCnt    = tgtNodes.length;
        var srcWay         = graph.entity(selectedIDs[1]);
        var srcNodes       = srcWay.nodes.slice();

        var startNodeId = getStartNodeId(selectedIDs[2], tgtNodes, srcNodes);
        var endNodeId   = getEndNodeId(startNodeId, selectedIDs[3], tgtNodes, srcNodes);

        var startNodeIdxInTgt = tgtNodes.indexOf(startNodeId);
        var endNodeIdxInTgt   = tgtNodes.indexOf(endNodeId);
        var startNodeIdxInSrc = srcNodes.indexOf(startNodeId);
        var endNodeIdxInSrc   = srcNodes.indexOf(endNodeId);

        var tgtIsLastSegmentOfClosedWay = tgtWayIsClosed && ((startNodeIdxInTgt === 0 && endNodeIdxInTgt === tgtNodesCnt - 2) || (endNodeIdxInTgt === 0 && startNodeIdxInTgt === tgtNodesCnt - 2));

        // make sure the nodes are shared by source and target ways, and that are consecutive in target way
        if (startNodeIdxInTgt === -1 || endNodeIdxInTgt === -1 || startNodeIdxInSrc === -1 || endNodeIdxInSrc === -1) {
            return 'nodes_are_not_shared_by_both_ways';
        }

        if (tgtIsLastSegmentOfClosedWay) {
          return false;
        }

        if (Math.abs(startNodeIdxInTgt - endNodeIdxInTgt) !== 1 && (endNodeIdxInTgt !== tgtNodesCnt - 1 || startNodeIdxInTgt !== 0)) {
            return 'nodes_are_not_consecutive_in_target';
        }
        return false;

    };

    action.transitionable = true;


    return action;
}
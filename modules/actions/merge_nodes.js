import { actionConnect } from './connect';
import { geoVecAdd, geoVecScale } from '../geo';


// `actionMergeNodes` is just a combination of:
//
// 1. move all the nodes to a common location
// 2. `actionConnect` them

export function actionMergeNodes(nodeIDs, loc) {

    // If there is a single "interesting" node, use that as the location.
    // Otherwise return the average location of all the nodes.
    function chooseLoc(graph) {
        if (!nodeIDs.length) return null;
        let sum = [0,0];
        let interestingCount = 0;
        let interestingLoc;

        for (let i = 0; i < nodeIDs.length; i++) {
            const node = graph.entity(nodeIDs[i]);
            if (node.hasInterestingTags()) {
                interestingLoc = (++interestingCount === 1) ? node.loc : null;
            }
            sum = geoVecAdd(sum, node.loc);
        }

        return interestingLoc || geoVecScale(sum, 1 / nodeIDs.length);
    }


    const action = function(graph) {
        if (nodeIDs.length < 2) return graph;
        let toLoc = loc;
        if (!toLoc) {
            toLoc = chooseLoc(graph);
        }

        for (let i = 0; i < nodeIDs.length; i++) {
            const node = graph.entity(nodeIDs[i]);
            if (node.loc !== toLoc) {
                graph = graph.replace(node.move(toLoc));
            }
        }

        return actionConnect(nodeIDs)(graph);
    };


    action.disabled = function(graph) {
        if (nodeIDs.length < 2) return 'not_eligible';

        for (let i = 0; i < nodeIDs.length; i++) {
            const entity = graph.entity(nodeIDs[i]);
            if (entity.type !== 'node') return 'not_eligible';
        }

        return actionConnect(nodeIDs).disabled(graph);
    };

    return action;
}

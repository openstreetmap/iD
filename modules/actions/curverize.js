import { osmNode } from '../osm/node';
import { osmWay } from '../osm/way';
import { geoRotate, geoVecAngle, geoVecLength, geoVecAdd, geoVecNormalize, geoLineIntersection, geoVecScale, geoVecSubtract } from '../geo';

export function actionCurverize(selectedIds, projection) {

    var action = function (graph) {

        const entities = selectedIds.map(function (selectedID) {
            return graph.entity(selectedID);
        });

        // get the way and its last node to curverize:
        let way = null;
        let lastNode = null;
        if (selectedIds.length === 2 && entities[0].type === 'way' && entities[1].type === 'node') {
            way = entities[0];
            lastNode = entities[1];
        } else if (selectedIds.length === 1 && entities[0].type === 'node') {
            const nodeParentWays = graph.parentWays(entities[0]);
            way = nodeParentWays[0];
            lastNode = entities[0];
        }
        const lastNodeIdx = way.nodes.indexOf(lastNode.id);

        // get four last nodes of way (the nodes to use for the curve):
        let lastFourNodesIds = [];
        let lastFourNodes = [];
        if (lastNodeIdx === 0) {
            lastFourNodesIds = [way.nodes[3], way.nodes[2], way.nodes[1], way.nodes[0]];
            lastFourNodes = [graph.entity(way.nodes[3]), graph.entity(way.nodes[2]), graph.entity(way.nodes[1]), graph.entity(way.nodes[0])];
        } else if (lastNodeIdx === way.nodes.length - 1) {
            lastFourNodesIds = [way.nodes[way.nodes.length - 4], way.nodes[way.nodes.length - 3], way.nodes[way.nodes.length - 2], way.nodes[way.nodes.length - 1]];
            lastFourNodes = [graph.entity(way.nodes[way.nodes.length - 4]), graph.entity(way.nodes[way.nodes.length - 3]), graph.entity(way.nodes[way.nodes.length - 2]), graph.entity(way.nodes[way.nodes.length - 1])];
        }
        const lastFourPoints = lastFourNodes.map(function(n) { return projection(n.loc); });

        console.log('lastFourNodesIds', lastFourNodesIds);



        // get the angles of the first and last pairs of nodes:
        const angle1 = geoVecAngle(lastFourPoints[0], lastFourPoints[1]);
        const angle2 = geoVecAngle(lastFourPoints[2], lastFourPoints[3]);
        const distanceBetweenTangents = geoVecLength(lastFourPoints[1], lastFourPoints[2]);
        console.log('angle1', angle1, 'angle2', angle2, 'distanceBetweenTangents', distanceBetweenTangents);
        const tangent1Length = geoVecLength(lastFourPoints[0], lastFourPoints[1]);
        const tangent2Length = geoVecLength(lastFourPoints[2], lastFourPoints[3]);
        console.log('tangent1Length', tangent1Length, 'tangent2Length', tangent2Length);
        const tangent1IntersectionScale = 1000.0;
        const tangent2IntersectionScale = 1000.0;
        console.log('tangent1IntersectionScale', tangent1IntersectionScale, 'tangent2IntersectionScale', tangent2IntersectionScale);
        console.log('tangent1Line', [lastFourPoints[0], lastFourPoints[1]]);
        console.log('tangent2Line', [lastFourPoints[3], lastFourPoints[2]]);
        const tangent1Vector = geoVecSubtract(lastFourPoints[1], lastFourPoints[0]);
        const tangent2Vector = geoVecSubtract(lastFourPoints[2], lastFourPoints[3]);
        console.log('tangent1Vector', tangent1Vector);
        console.log('tangent2Vector', tangent2Vector);
        //const tangent1UnitVector = geoVecNormalize([lastFourNodes[0].loc, lastFourNodes[1].loc]);
        //const tangent2UnitVector = geoVecNormalize([lastFourNodes[2].loc, lastFourNodes[3].loc]);
        const tangent1Scaled = [lastFourPoints[1], geoVecAdd(lastFourPoints[1], geoVecScale(tangent1Vector, tangent1IntersectionScale))];
        const tangent2Scaled = [lastFourPoints[2], geoVecAdd(lastFourPoints[2], geoVecScale(tangent2Vector, tangent2IntersectionScale))];
        console.log('tangent1LineScaled', tangent1Scaled);
        console.log('tangent2LineScaled', tangent2Scaled);

        let tangentsIntersection = geoLineIntersection(tangent1Scaled, tangent2Scaled);
        if (!tangentsIntersection) { // ignore if no intersection (TODO: it should be possible in some situation to curverize event if the intersection could not be found in the default simple direction)
            console.log('curverize is not yet implemented for these angles, ignoring')
            return graph;
        }

        let inverseTangent1 = [lastFourPoints[1], tangentsIntersection];
        let inverseTangent2 = [lastFourPoints[2], tangentsIntersection];
        const inverseTangent1Length = geoVecLength(inverseTangent1[0], inverseTangent1[1]);
        const inverseTangent2Length = geoVecLength(inverseTangent2[0], inverseTangent2[1]);

        const minTangentLength = Math.min(inverseTangent1Length, inverseTangent2Length);
        const circleRadius = minTangentLength;

        let test1Line = [];
        if (inverseTangent1Length < inverseTangent2Length) {
            inverseTangent2 = geoVecAdd(inverseTangent1[1], geoVecScale(geoVecNormalize(geoVecSubtract(inverseTangent2[1], inverseTangent2[0])), inverseTangent1Length);
            test1Line = geoRotate(inverseTangent1, Math.PI/2, inverseTangent1[0]);
        } else {
            test1Line = geoRotate(inverseTangent2, Math.PI/2, inverseTangent2[0]);
        }

        const nodeA = osmNode({ loc: projection.invert(test1Line[0]) });
        const nodeB = osmNode({ loc: projection.invert(test1Line[1]) });
        const wayA = osmWay({nodes: [nodeA.id, nodeB.id]});
        graph = graph.replace(nodeA);
        graph = graph.replace(nodeB);
        graph = graph.replace(wayA);
        
        const circleCenter = [];

        const node1 = osmNode({ loc: projection.invert(inverseTangent1[0]) });
        const node2 = osmNode({ loc: projection.invert(inverseTangent1[1]) });
        const node3 = osmNode({ loc: projection.invert(inverseTangent2[0]) });
        const node4 = osmNode({ loc: projection.invert(inverseTangent2[1]) });

        graph = graph.replace(node1);
        graph = graph.replace(node2);
        graph = graph.replace(node3);
        graph = graph.replace(node4);

        const way1 = osmWay({nodes: [node1.id, node2.id]});
        const way2 = osmWay({nodes: [node3.id, node4.id]});
        graph = graph.replace(way1);
        graph = graph.replace(way2);



        //const tangentsIntersection = geoLineIntersection(tangent1Scaled, tangent2Scaled);
        //const tangent1UnitVector = geoVecNormalize([lastFourNodes[0].loc, lastFourNodes[1].loc]);
        //const tangent2UnitVector = geoVecNormalize([lastFourNodes[2].loc, lastFourNodes[3].loc]);
        console.log('tangentsIntersection', tangentsIntersection);
        //console.log('tangent1UnitVector', tangent1UnitVector);
        //console.log('tangent2UnitVector', tangent2UnitVector);
        return graph;
    };

    action.disabled = function (graph) {

        return false;

    };

    action.transitionable = true;

    return action;
}

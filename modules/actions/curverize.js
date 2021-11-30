import { osmNode } from '../osm/node';
import { osmWay } from '../osm/way';
import { geoRotate, geoVecAngle, geoVecLength, geoVecAngleBetween, geoVecAdd, geoVecNormalize, geoInfiniteLineIntersection, geoVecScale, geoVecSubtract } from '../geo';

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
        let direction = 'forward';
        if (lastNodeIdx === 0) {
            lastFourNodesIds = [way.nodes[3], way.nodes[2], way.nodes[1], way.nodes[0]];
            lastFourNodes = [graph.entity(way.nodes[3]), graph.entity(way.nodes[2]), graph.entity(way.nodes[1]), graph.entity(way.nodes[0])];
        } else if (lastNodeIdx === way.nodes.length - 1) {
            lastFourNodesIds = [way.nodes[way.nodes.length - 4], way.nodes[way.nodes.length - 3], way.nodes[way.nodes.length - 2], way.nodes[way.nodes.length - 1]];
            lastFourNodes = [graph.entity(way.nodes[way.nodes.length - 4]), graph.entity(way.nodes[way.nodes.length - 3]), graph.entity(way.nodes[way.nodes.length - 2]), graph.entity(way.nodes[way.nodes.length - 1])];
            direction = 'backward';
        }
        const lastFourPoints = lastFourNodes.map(function(n) { return projection(n.loc); });

        console.log('lastFourNodesIds', lastFourNodesIds);



        // get the angles of the first and last pairs of nodes:
        const angle1 = geoVecAngle(lastFourPoints[0], lastFourPoints[1]);
        const angle2 = geoVecAngle(lastFourPoints[2], lastFourPoints[3]);
        const distanceBetweenTangents = geoVecLength(lastFourPoints[1], lastFourPoints[2]);
        console.log('angle1', angle1, 'angle2', angle2, 'distanceBetweenTangents', distanceBetweenTangents);
        //const tangent1Length = geoVecLength(lastFourPoints[0], lastFourPoints[1]);
        //const tangent2Length = geoVecLength(lastFourPoints[2], lastFourPoints[3]);
        //console.log('tangent1Length', tangent1Length, 'tangent2Length', tangent2Length);
        //const tangent1Vector = geoVecSubtract(lastFourPoints[1], lastFourPoints[0]);
        //const tangent2Vector = geoVecSubtract(lastFourPoints[2], lastFourPoints[3]);
        //console.log('tangent1Vector', tangent1Vector);
        //console.log('tangent2Vector', tangent2Vector);
        //const tangent1UnitVector = geoVecNormalize([lastFourNodes[0].loc, lastFourNodes[1].loc]);
        //const tangent2UnitVector = geoVecNormalize([lastFourNodes[2].loc, lastFourNodes[3].loc]);
        //const tangent1Scaled = [lastFourPoints[1], geoVecAdd(lastFourPoints[1], geoVecScale(tangent1Vector, tangent1IntersectionScale))];
        //const tangent2Scaled = [lastFourPoints[2], geoVecAdd(lastFourPoints[2], geoVecScale(tangent2Vector, tangent2IntersectionScale))];
        //console.log('tangent1LineScaled', tangent1Scaled);
        //console.log('tangent2LineScaled', tangent2Scaled);


        const tangent1Line = [lastFourPoints[0], lastFourPoints[1]];
        const tangent2Line = [lastFourPoints[3], lastFourPoints[2]];
        const tangent1Vector = geoVecSubtract(tangent1Line[1], tangent1Line[0]);
        const tangent2Vector = geoVecSubtract(tangent2Line[1], tangent2Line[0]);
        const tangent1UnitVector = geoVecNormalize(tangent1Vector);
        const tangent2UnitVector = geoVecNormalize(tangent2Vector);

        // find intersection of the tangents:
        let tangentsIntersection = geoInfiniteLineIntersection(tangent1Line, tangent2Line);
        if (!tangentsIntersection) {
            console.log('could not find line segments intersection, they may be parallel')
            return graph;
        }

        const tangent1LengthToIntersection = geoVecLength(tangent1Line[1], tangentsIntersection);
        const tangent2LengthToIntersection = geoVecLength(tangent2Line[1], tangentsIntersection);
        const minLengthToIntersection = Math.min(tangent1LengthToIntersection, tangent2LengthToIntersection);

        const tangent1MinifiedLine = [tangentsIntersection, geoVecSubtract(tangentsIntersection, geoVecScale(tangent1UnitVector, minLengthToIntersection))];
        const tangent2MinifiedLine = [tangentsIntersection, geoVecSubtract(tangentsIntersection, geoVecScale(tangent2UnitVector, minLengthToIntersection))];
        console.log('tangent1Line', tangent1Line);
        console.log('tangent1Length', tangent1LengthToIntersection);
        console.log('tangent1Vector', tangent1Vector);
        console.log('tangent1UnitVector', tangent1UnitVector);
        console.log('tangent1MinifiedLine', tangent1MinifiedLine);
        console.log('tangent2MinifiedLine', tangent2MinifiedLine);

        const tangent1PerpendicularMinifiedLine = geoRotate(tangent1MinifiedLine, -Math.PI/2, tangent1MinifiedLine[1]);
        const tangent2PerpendicularMinifiedLine = geoRotate(tangent2MinifiedLine, Math.PI/2, tangent2MinifiedLine[1]);

        // find intersection of the tangents:
        let circleCenter = geoInfiniteLineIntersection(tangent1PerpendicularMinifiedLine, tangent2PerpendicularMinifiedLine);
        if (!circleCenter) {
            console.log('could not find a circle center to draw arc')
            return graph;
        }
        /*const nodeTangentIntersection = osmNode({ loc: projection.invert(tangentsIntersection) });
        graph = graph.replace(nodeTangentIntersection);

        const nodeCircleCenter = osmNode({ loc: projection.invert(circleCenter) });
        graph = graph.replace(nodeCircleCenter);*/

        const radiusLineStart = [circleCenter, tangent1MinifiedLine[1]];
        const radiusLineEnd = [circleCenter, tangent2MinifiedLine[1]];

        let angleRadiusLineStart = geoVecAngle(radiusLineStart[0], radiusLineStart[1]);
        let angleRadiusLineEnd = geoVecAngle(radiusLineEnd[0], radiusLineEnd[1]);
        console.log('angleRadiusLineStart', angleRadiusLineStart*180/Math.PI, 'angleRadiusLineEnd', angleRadiusLineEnd*180/Math.PI);

        let arcAngleRad = geoVecAngleBetween(angleRadiusLineStart, angleRadiusLineEnd);
        const arcAngleDeg = arcAngleRad * 180.0 / Math.PI;
        console.log('arcAngle', arcAngleRad, arcAngleDeg);

        const numberOfSegments = Math.max(2, Math.ceil(arcAngleDeg / 10.0));

        const radiusNodes = [];

        for (let i = 0; i < numberOfSegments; i++) {
            console.log('angle ' + i, (180.0 / Math.PI) * i * arcAngleRad / numberOfSegments);
            const radiusSegment = geoRotate(radiusLineStart, - i * arcAngleRad / numberOfSegments, circleCenter);
            const arcPoint = radiusSegment[1];
            radiusNodes.push(osmNode({ loc: projection.invert(arcPoint) }));
        }
        console.log('radiusNodes', radiusNodes);
        /*const radiusNodes = [
            osmNode({ loc: projection.invert(radiusLineStart[0]) }),
            osmNode({ loc: projection.invert(radiusLineStart[1]) }),
            osmNode({ loc: projection.invert(radiusLineEnd[0]) }),
            osmNode({ loc: projection.invert(radiusLineEnd[1]) })
        ];*/
        for (let i = 0; i < radiusNodes.length; i++) {
            graph = graph.replace(radiusNodes[i]);
        }

        console.log('graph', graph);

        const radiusNodesIds = radiusNodes.map(function(node) { return node.id });
        console.log('radiusNodesIds', radiusNodesIds);
        if (direction === 'forward') {
            way.nodes.splice(2, 0, ...radiusNodesIds);
            console.log('way forward', way);
        } else if (direction === 'backward') {
            way.nodes.splice(way.nodes.length - 3, 0, ...(radiusNodesIds.reverse()));
            console.log('way backward', way);
        }
        graph = graph.replace(way);

        /*const radiusWays = [
            osmWay({nodes: radiusNodes})
        ];
        for (let i = 0; i < radiusWays.length; i++) {
            graph = graph.replace(radiusWays[i]);
        }*/



        /*const tangent1LineNode1 = osmNode({ loc: projection.invert(tangent1Line[0]) });
        const tangent1LineNode2 = osmNode({ loc: projection.invert(tangent1Line[1]) });
        const tangent2LineNode1 = osmNode({ loc: projection.invert(tangent2Line[0]) });
        const tangent2LineNode2 = osmNode({ loc: projection.invert(tangent2Line[1]) });
       
        graph = graph.replace(tangent1LineNode1);
        graph = graph.replace(tangent1LineNode2);
        graph = graph.replace(tangent2LineNode1);
        graph = graph.replace(tangent2LineNode2);

        const tangentLine1Way = osmWay({nodes: [tangent1LineNode1.id, tangent1LineNode2.id]});
        const tangentLine2Way = osmWay({nodes: [tangent2LineNode1.id, tangent2LineNode2.id]});

        graph = graph.replace(tangentLine1Way);
        graph = graph.replace(tangentLine2Way);*/

        /*const tangent1MinifiedLineNode1 = osmNode({ loc: projection.invert(tangent1MinifiedLine[0]) });
        const tangent1MinifiedLineNode2 = osmNode({ loc: projection.invert(tangent1MinifiedLine[1]) });
        const tangent2MinifiedLineNode1 = osmNode({ loc: projection.invert(tangent2MinifiedLine[0]) });
        const tangent2MinifiedLineNode2 = osmNode({ loc: projection.invert(tangent2MinifiedLine[1]) });

        console.log('tangent1MinifiedLineNode1', tangent1MinifiedLineNode1);
        console.log('tangent1MinifiedLineNode2', tangent1MinifiedLineNode2);
        console.log('tangent2MinifiedLineNode1', tangent2MinifiedLineNode1);
        console.log('tangent2MinifiedLineNode2', tangent2MinifiedLineNode2);

        graph = graph.replace(tangent1MinifiedLineNode1);
        graph = graph.replace(tangent1MinifiedLineNode2);
        graph = graph.replace(tangent2MinifiedLineNode1);
        graph = graph.replace(tangent2MinifiedLineNode2);

        const tangent1MinifiedLineWay = osmWay({nodes: [tangent1MinifiedLineNode1.id, tangent1MinifiedLineNode2.id]});
        const tangent2MinifiedLineWay = osmWay({nodes: [tangent2MinifiedLineNode1.id, tangent2MinifiedLineNode2.id]});
        console.log('tangent1MinifiedLineWay', tangent1MinifiedLineWay);
        console.log('tangent2MinifiedLineWay', tangent2MinifiedLineWay);

        graph = graph.replace(tangent1MinifiedLineWay);
        graph = graph.replace(tangent2MinifiedLineWay);*/




        /*const tangent1PerpendicularMinifiedLineNode1 = osmNode({ loc: projection.invert(tangent1PerpendicularMinifiedLine[0]) });
        const tangent1PerpendicularMinifiedLineNode2 = osmNode({ loc: projection.invert(tangent1PerpendicularMinifiedLine[1]) });
        const tangent2PerpendicularMinifiedLineNode1 = osmNode({ loc: projection.invert(tangent2PerpendicularMinifiedLine[0]) });
        const tangent2PerpendicularMinifiedLineNode2 = osmNode({ loc: projection.invert(tangent2PerpendicularMinifiedLine[1]) });

        console.log('tangent1PerpendicularMinifiedLineNode1', tangent1PerpendicularMinifiedLineNode1);
        console.log('tangent1PerpendicularMinifiedLineNode2', tangent1PerpendicularMinifiedLineNode2);
        console.log('tangent2PerpendicularMinifiedLineNode1', tangent2PerpendicularMinifiedLineNode1);
        console.log('tangent2PerpendicularMinifiedLineNode2', tangent2PerpendicularMinifiedLineNode2);

        graph = graph.replace(tangent1PerpendicularMinifiedLineNode1);
        graph = graph.replace(tangent1PerpendicularMinifiedLineNode2);
        graph = graph.replace(tangent2PerpendicularMinifiedLineNode1);
        graph = graph.replace(tangent2PerpendicularMinifiedLineNode2);

        const tangent1PerpendicularMinifiedLineWay = osmWay({nodes: [tangent1PerpendicularMinifiedLineNode1.id, tangent1PerpendicularMinifiedLineNode2.id]});
        const tangent2PerpendicularMinifiedLineWay = osmWay({nodes: [tangent2PerpendicularMinifiedLineNode1.id, tangent2PerpendicularMinifiedLineNode2.id]});
        console.log('tangent1PerpendicularMinifiedLineWay', tangent1PerpendicularMinifiedLineWay);
        console.log('tangent2PerpendicularMinifiedLineWay', tangent2PerpendicularMinifiedLineWay);

        graph = graph.replace(tangent1PerpendicularMinifiedLineWay);
        graph = graph.replace(tangent2PerpendicularMinifiedLineWay);*/

        //graph = graph.replace(nodeA);
        //graph = graph.replace(nodeB);
        //graph = graph.replace(wayA);
        //let inverseTangent1 = [lastFourPoints[1], tangentsIntersection];
        //let inverseTangent2 = [lastFourPoints[2], tangentsIntersection];
        //const inverseTangent1Length = geoVecLength(inverseTangent1[0], inverseTangent1[1]);
        //const inverseTangent2Length = geoVecLength(inverseTangent2[0], inverseTangent2[1]);

        //const minTangentLength = Math.min(inverseTangent1Length, inverseTangent2Length);
        //const circleRadius = minTangentLength;



        /*let test1Line = [];
        if (inverseTangent1Length < inverseTangent2Length) {
            inverseTangent2 = geoVecAdd(inverseTangent1[1], geoVecScale(geoVecNormalize(geoVecSubtract(inverseTangent2[1], inverseTangent2[0])), inverseTangent1Length);
            test1Line = geoRotate(inverseTangent1, Math.PI/2, inverseTangent1[0]);
        } else {
            test1Line = geoRotate(inverseTangent2, Math.PI/2, inverseTangent2[0]);
        }*/

        //const nodeA = osmNode({ loc: projection.invert(test1Line[0]) });
        //const nodeB = osmNode({ loc: projection.invert(test1Line[1]) });
        //const wayA = osmWay({nodes: [nodeA.id, nodeB.id]});
        //graph = graph.replace(nodeA);
        //graph = graph.replace(nodeB);
        //graph = graph.replace(wayA);
        
        //const circleCenter = [];
//
        //const node1 = osmNode({ loc: projection.invert(inverseTangent1[0]) });
        //const node2 = osmNode({ loc: projection.invert(inverseTangent1[1]) });
        //const node3 = osmNode({ loc: projection.invert(inverseTangent2[0]) });
        //const node4 = osmNode({ loc: projection.invert(inverseTangent2[1]) });

        //graph = graph.replace(node1);
        //graph = graph.replace(node2);
        //graph = graph.replace(node3);
        //graph = graph.replace(node4);

        //const way1 = osmWay({nodes: [node1.id, node2.id]});
        //const way2 = osmWay({nodes: [node3.id, node4.id]});
        //graph = graph.replace(way1);
        //graph = graph.replace(way2);



        //const tangentsIntersection = geoLineIntersection(tangent1Scaled, tangent2Scaled);
        //const tangent1UnitVector = geoVecNormalize([lastFourNodes[0].loc, lastFourNodes[1].loc]);
        //const tangent2UnitVector = geoVecNormalize([lastFourNodes[2].loc, lastFourNodes[3].loc]);
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

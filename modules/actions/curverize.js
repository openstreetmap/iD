import { osmNode } from '../osm/node';
import { osmWay } from '../osm/way';
import { geoRotate, geoVecAngle, geoVecLength, geoVecAngleBetween, geoVecAdd, geoVecNormalize, geoInfiniteLineIntersection, geoVecScale, geoVecSubtract } from '../geo';

export function actionCurverize(selectedIds, projection) {

    var action = function (graph) {

        console.log('graph before', graph.entities);

        const entities = selectedIds.map(function (selectedID) {
            return graph.entity(selectedID);
        });

        console.log('entities', entities);

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
        } else if (selectedIds.length === 1 && entities[0].type === 'way') {
            way = entities[0];
            lastNode = graph.entity(entities[0].nodes[entities[0].nodes.length - 1]);
        }
        const lastNodeIdx = way.nodes.indexOf(lastNode.id);

        console.log('lastNodeIdx', lastNodeIdx);

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
            lastFourNodesIds = lastFourNodesIds.reverse();
            lastFourNodes = lastFourNodes.reverse();
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

        const numberOfSegments = Math.max(2, Math.ceil(arcAngleDeg / 5.0));

        const radiusNodes = [];

        for (let i = 0; i < numberOfSegments; i++) {
            console.log('angle ' + i, (180.0 / Math.PI) * i * arcAngleRad / numberOfSegments);
            const radiusSegment = geoRotate(radiusLineStart, - i * arcAngleRad / numberOfSegments, circleCenter);
            const arcPoint = radiusSegment[1];
            radiusNodes.push(osmNode({ loc: projection.invert(arcPoint) }));
        }
        console.log('radiusNodes', radiusNodes);
        for (let i = 0; i < radiusNodes.length; i++) {
            graph = graph.replace(radiusNodes[i]);
        }

        console.log('graph', graph);

        const radiusNodesIds = radiusNodes.map(function(node) { return node.id });
        const wayNodes = [...(way.nodes)];
        console.log('radiusNodesIds', radiusNodesIds);
        if (direction === 'forward') {
            wayNodes.splice(2, 0, ...(radiusNodesIds.reverse()));
            console.log('way forward', way);
        } else if (direction === 'backward') {
            wayNodes.splice(wayNodes.length - 2, 0, ...(radiusNodesIds.reverse()));
            console.log('way backward', way);
        }
        way = way.update({nodes: wayNodes});
        graph = graph.replace(way);

        console.log('end curverize');

        return graph;
    };

    action.disabled = function (graph) {

        return false;

    };

    action.transitionable = true;

    return action;
}

import { geoExtent, geoLineIntersection } from '../geo';
import { set as d3_set } from 'd3-collection';
import { t } from '../util/locale';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
} from './validation_issue';


export function validationHighwayCrossingOtherWays() {
    // Check if the edge going from n1 to n2 crosses (without a connection node)
    // any edge on way. Return the corss point if so.
    function findEdgeToWayCrossCoords(n1, n2, way, graph, edgePairsVisited) {
        var crossCoords = [];
        for (var j = 0; j < way.nodes.length - 1; j++) {
            var nidA = way.nodes[j],
                nidB = way.nodes[j + 1];
            if (nidA === n1.id || nidA === n2.id ||
                nidB === n1.id || nidB === n2.id) {
                // n1 or n2 is a connection node; skip
                continue;
            }

            var edgePair = edgePairString(n1.id, n2.id, nidA, nidB);
            if (edgePairsVisited.has(edgePair)) continue;
            edgePairsVisited.add(edgePair);

            var nA = graph.entity(nidA),
                nB = graph.entity(nidB),
                point = geoLineIntersection([n1.loc, n2.loc], [nA.loc, nB.loc]);
            if (point) crossCoords.push(point);
        }
        return crossCoords;
    }

    // n1 and n2 from one edge, nA and nB from the other edge
    function edgePairString(n1, n2, nA, nB) {
        return n1 > nA ? n1 + n2 + nA + nB : nA + nB + n1 + n2;
    }

    function findCrossingsByWay(entity, graph, tree, edgePairsVisited) {
        var edgeCrossInfos = [];
        if (entity.type !== 'way' || !entity.tags.highway) return edgeCrossInfos;
        if (entity.geometry(graph) !== 'line') return edgeCrossInfos;

        for (var i = 0; i < entity.nodes.length - 1; i++) {
            var nid1 = entity.nodes[i],
                nid2 = entity.nodes[i + 1],
                n1 = graph.entity(nid1),
                n2 = graph.entity(nid2),
                extent = geoExtent([
                    [
                        Math.min(n1.loc[0], n2.loc[0]),
                        Math.min(n1.loc[1], n2.loc[1])
                    ],
                    [
                        Math.max(n1.loc[0], n2.loc[0]),
                        Math.max(n1.loc[1], n2.loc[1])
                    ]
                ]),
                intersected = tree.intersects(extent, graph);
            for (var j = 0; j < intersected.length; j++) {
                if (intersected[j].type !== 'way') continue;

                // only check crossing highway, waterway, building, and railway
                var way = intersected[j];
                if (!(way.tags.highway || way.tags.building ||
                      way.tags.railway || way.tags.waterway)) {
                    continue;
                }
                if (way.tags.waterway && entity.tags.bridge === 'yes') {
                    continue;
                }
                var crossCoords = findEdgeToWayCrossCoords(n1, n2, way, graph, edgePairsVisited);
                for (var k = 0; k < crossCoords.length; k++) {
                    edgeCrossInfos.push({
                        ways: [entity, way],
                        cross_point: crossCoords[k],
                    });
                }
            }
        }
        return edgeCrossInfos;
    }


    var validation = function(changes, graph, tree) {
        // create one issue per crossing point
        var edited = changes.created.concat(changes.modified),
            edgePairsVisited = d3_set(),
            issues = [];
        for (var i = 0; i < edited.length; i++) {
            var crosses = findCrossingsByWay(edited[i], graph, tree, edgePairsVisited);
            for (var j = 0; j < crosses.length; j++) {
                issues.push(new validationIssue({
                    type: ValidationIssueType.crossing_ways,
                    severity: ValidationIssueSeverity.error,
                    message: t('validations.crossing_ways'),
                    tooltip: t('validations.crossing_ways_tooltip'),
                    entities: crosses[j].ways,
                    coordinates: crosses[j].cross_point,
                }));
            }
        }

        return issues;
    };


    return validation;
}

import _clone from 'lodash-es/clone';
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

    function getWayAndParentRelationTags(way, graph) {
        var tags = _clone(way.tags);
        var parentRels = graph.parentRelations(way);
        for (var i = 0; i < parentRels.length; i++) {
            var rel = parentRels[i];
            for (k in rel.tags) {
                if (!tags[k]) tags[k] = rel.tags[k];
            }
        }
        return tags;
    }

    function hasTag(tags, key) {
        return tags[key] !== undefined && tags[key] !== 'no';
    }

    function getFeatureTypeForCrossingCheck(way, graph) {
        var tags = getWayAndParentRelationTags(way, graph);
        if (hasTag(tags, 'highway')) return 'highway';
        if (hasTag(tags, 'building')) return 'building';
        if (hasTag(tags, 'railway')) return 'railway';
        if (hasTag(tags, 'waterway') || tags.natural === 'water') return 'water';

        return null;
    }

    function extendTagsByInferredLayer(tags, way) {
        if (!hasTag(tags, 'layer')) {
            tags.layer = way.layer().toString();
        }
        return tags;
    }

    function isLegitCrossing(way1, featureType1, way2, featureType2, graph) {
        var tags1 = getWayAndParentRelationTags(way1, graph),
            tags2 = getWayAndParentRelationTags(way2, graph);
        tags1 = extendTagsByInferredLayer(tags1, way1);
        tags2 = extendTagsByInferredLayer(tags2, way2);

        // For better readability, not chaining all the true conditions into one if statement.
        if ((featureType1 === 'highway' && featureType2 === 'highway') ||
            (featureType1 === 'highway' && featureType2 === 'railway') ||
            (featureType1 === 'railway' && featureType2 === 'railway')) {
            // Legit cases:
            // (1) they're on different layers
            // (2) only one of the two ways is on a bridge
            // (3) only one of the two ways is in a tunnel
            if (tags1.layer !== tags2.layer) return true;
            if (hasTag(tags1, 'bridge') && !hasTag(tags2, 'bridge')) return true;
            if (!hasTag(tags1, 'bridge') && hasTag(tags2, 'bridge')) return true;
            if (hasTag(tags1, 'tunnel') && !hasTag(tags2, 'tunnel')) return true;
            if (!hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel')) return true;
        }
        if ((featureType1 === 'highway' && featureType2 === 'water') ||
            (featureType1 === 'railway' && featureType2 === 'water')) {
            // Legit cases:
            // (1) highway/railway is on a bridge
            // (2) only one of the two ways is in a tunnel
            // (3) both are in tunnels but on different layers
            if (hasTag(tags1, 'bridge')) return true;
            if (hasTag(tags1, 'tunnel') && !hasTag(tags2, 'tunnel')) return true;
            if (!hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel')) return true;
            if (hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel') && tags1.layer !== tags2.layer) return true;
        }
        if ((featureType1 === 'highway' && featureType2 === 'building') ||
            (featureType1 === 'railway' && featureType2 === 'building')) {
            // Legit cases:
            // (1) highway/railway has a bridge or tunnel tag
            // (2) highway/railway has a covered tag
            if (hasTag(tags1, 'bridge') || hasTag(tags1, 'tunnel') || hasTag(tags1, 'covered')) return true;
        }
        if (featureType1 === 'water' && featureType2 === 'water') {
            // Legit cases:
            // (1) only one of the water is in a tunnel
            // (2) both are in tunnels but on differnt layers
            if (hasTag(tags1, 'tunnel') && !hasTag(tags2, 'tunnel')) return true;
            if (!hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel')) return true;
            if (hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel') && tags1.layer !== tags2.layer) return true;
        }
        if (featureType1 === 'water' && featureType2 === 'building') {
            // Legit cases:
            // (1) water is in a tunnel
            // (2) water has a covered tag
            if (hasTag(tags1, 'tunnel') || hasTag(tags1, 'covered')) return true;
        }
        if (featureType1 === 'building' && featureType2 === 'building') {
            // Legit case: they're on different layers
            if (tags1.layer !== tags2.layer) return true;
        }
        return false;
    }

    function findCrossingsByWay(entity, graph, tree, edgePairsVisited) {
        var edgeCrossInfos = [];
        if (entity.geometry(graph) !== 'line' || entity.type !== 'way') return edgeCrossInfos;

        var entFeatureType = getFeatureTypeForCrossingCheck(entity, graph);
        if (entFeatureType === null) return edgeCrossInfos;

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
                var way = intersected[j],
                    wayFeatureType = getFeatureTypeForCrossingCheck(way, graph);
                if (wayFeatureType === null ||
                    isLegitCrossing(entity, entFeatureType, way, wayFeatureType, graph) ||
                    isLegitCrossing(way, wayFeatureType, entity, entFeatureType, graph)) {
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
                    message: t('issues.crossing_ways.message'),
                    tooltip: t('issues.crossing_ways.tooltip'),
                    entities: crosses[j].ways,
                    coordinates: crosses[j].cross_point,
                }));
            }
        }

        return issues;
    };


    return validation;
}

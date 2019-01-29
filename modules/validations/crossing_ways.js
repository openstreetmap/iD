import _clone from 'lodash-es/clone';
import _map from 'lodash-es/map';
import _flattenDeep from 'lodash-es/flatten';
import { geoExtent, geoLineIntersection } from '../geo';
import { set as d3_set } from 'd3-collection';
import { utilDisplayLabel } from '../util';
import { t } from '../util/locale';
import {
    ValidationIssueType,
    ValidationIssueSeverity,
    validationIssue,
    validationIssueFix
} from './validation_issue';
import { osmNode } from '../osm';
import { actionAddMidpoint } from '../actions';
import { geoChooseEdge } from '../geo';


export function validationHighwayCrossingOtherWays(context) {
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

    // returns the way or its parent relation, whichever has a useful feature type
    function getFeatureWithFeatureTypeTagsForWay(way, graph) {
        if (getFeatureTypeForTags(way.tags) === null) {
            // if the way doesn't match a feature type, check is parent relations
            var parentRels = graph.parentRelations(way);
            for (var i = 0; i < parentRels.length; i++) {
                var rel = parentRels[i];
                if (getFeatureTypeForTags(rel.tags) !== null) {
                    return rel;
                }
            }
        }
        return way;
    }

    function hasTag(tags, key) {
        return tags[key] !== undefined && tags[key] !== 'no';
    }

    function getFeatureTypeForCrossingCheck(way, graph) {
        var tags = getFeatureWithFeatureTypeTagsForWay(way, graph).tags;
        return getFeatureTypeForTags(tags);
    }

    // only validate certain waterway features
    var waterways = new Set(['canal', 'ditch', 'drain', 'river', 'stream']);
    // ignore certain highway and railway features
    var ignoredHighways = new Set(['rest_area', 'services']);
    var ignoredRailways = new Set(['train_wash']);

    function getFeatureTypeForTags(tags) {
        if (hasTag(tags, 'building')) return 'building';

        // don't check non-building areas
        if (hasTag(tags, 'area')) return null;

        if (hasTag(tags, 'highway') && !ignoredHighways.has(tags.highway)) return 'highway';
        if (hasTag(tags, 'railway') && !ignoredRailways.has(tags.railway)) return 'railway';
        if (hasTag(tags, 'waterway') && waterways.has(tags.waterway)) return 'waterway';

        return null;
    }

    function extendTagsByInferredLayer(tags, way) {
        if (!hasTag(tags, 'layer')) {
            tags.layer = way.layer().toString();
        }
        return tags;
    }

    function isLegitCrossing(way1, featureType1, way2, featureType2, graph) {
        var tags1 = _clone(getFeatureWithFeatureTypeTagsForWay(way1, graph).tags),
            tags2 = _clone(getFeatureWithFeatureTypeTagsForWay(way2, graph).tags);
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
        if ((featureType1 === 'highway' && featureType2 === 'waterway') ||
            (featureType1 === 'railway' && featureType2 === 'waterway')) {
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
        if (featureType1 === 'waterway' && featureType2 === 'waterway') {
            // Legit cases:
            // (1) only one of the water is in a tunnel
            // (2) both are in tunnels but on differnt layers
            if (hasTag(tags1, 'tunnel') && !hasTag(tags2, 'tunnel')) return true;
            if (!hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel')) return true;
            if (hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel') && tags1.layer !== tags2.layer) return true;
        }
        if (featureType1 === 'waterway' && featureType2 === 'building') {
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

    // highway values for which we shouldn't recommend connecting to waterways
    var highwaysDisallowingFords = new Set([
        'motorway', 'motorway_link', 'trunk', 'trunk_link',
        'primary', 'primary_link', 'secondary', 'secondary_link'
    ]);

    function canConnectEntities(entity1, entity2) {
        var featureType1 = getFeatureTypeForTags(entity1.tags);
        var featureType2 = getFeatureTypeForTags(entity2.tags);
        if (featureType1 === featureType2) {
            if (featureType1 === 'highway') return true;
            if (featureType1 === 'waterway') return true;
            if (featureType1 === 'railway') return true;
        } else {
            var featureTypes = new Set([featureType1, featureType2]);
            if (featureTypes.has('highway')) {
                if (featureTypes.has('waterway')) {
                    // do not allow fords on structures
                    if (hasTag(entity1.tags, 'tunnel') && hasTag(entity2.tags, 'tunnel')) return false;
                    if (hasTag(entity1.tags, 'bridge') && hasTag(entity2.tags, 'bridge')) return false;
                    if (highwaysDisallowingFords.has(entity1.tags.highway) ||
                        highwaysDisallowingFords.has(entity2.tags.highway)) {
                        return false
                    }
                    return true;
                }
                if (featureTypes.has('building') || featureTypes.has('railway')) return true;
            }
        }
        return false;
    }

    function findCrossingsByWay(entity, graph, tree, edgePairsVisited) {
        var edgeCrossInfos = [];
        if (entity.type !== 'way') return edgeCrossInfos;

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
                        featureTypes: [entFeatureType, wayFeatureType],
                        cross_point: crossCoords[k],
                    });
                }
            }
        }
        return edgeCrossInfos;
    }

    var validation = function(entitiesToCheck, graph, tree) {
        // create one issue per crossing point
        var edgePairsVisited = d3_set(),
            issues = [];
        var waysToCheck = _flattenDeep(_map(entitiesToCheck, function(entity) {
            if (!getFeatureTypeForTags(entity.tags)) {
                return [];
            }
            if (entity.type === 'way') {
                return entity;
            } else if (entity.type === 'relation' &&
                entity.tags.type === 'multipolygon' &&
                // only check multipolygons if they are buildings
                hasTag(entity.tags, 'building')) {
                return _map(entity.members, function(member) {
                    if (context.hasEntity(member.id)) {
                        var entity = context.entity(member.id);
                        if (entity.type === 'way') {
                            return entity;
                        }
                    }
                    return [];
                });
            }
            return [];
        }));
        for (var i = 0; i < waysToCheck.length; i++) {
            var crosses = findCrossingsByWay(waysToCheck[i], graph, tree, edgePairsVisited);
            for (var j = 0; j < crosses.length; j++) {
                var crossing = crosses[j];

                // use the entities with the tags that define the feature type
                var entities = crossing.ways.sort(function(entity1, entity2) {
                    var type1 = getFeatureTypeForCrossingCheck(entity1, graph);
                    var type2 = getFeatureTypeForCrossingCheck(entity2, graph);
                    if (type1 === type2) {
                        return utilDisplayLabel(entity1, context) > utilDisplayLabel(entity2, context);
                    } else if (type1 === 'waterway') {
                        return true;
                    } else if (type2 === 'waterway') {
                        return false;
                    }
                    return type1 < type2;
                });
                entities = _map(entities, function(way) {
                    return getFeatureWithFeatureTypeTagsForWay(way, graph);
                });

                var canConnect = canConnectEntities(entities[0], entities[1]);

                var crossingTypeID;
                if (hasTag(entities[0].tags, 'tunnel') && hasTag(entities[1].tags, 'tunnel')) {
                    crossingTypeID = 'tunnel-tunnel';
                    if (canConnect) {
                        crossingTypeID += '_connectable';
                    }
                }
                else if (hasTag(entities[0].tags, 'bridge') && hasTag(entities[1].tags, 'bridge')) {
                    crossingTypeID = 'bridge-bridge';
                    if (canConnect) {
                        crossingTypeID += '_connectable';
                    }
                }
                else {
                    crossingTypeID = crossing.featureTypes.sort().join('-');
                }

                var messageDict = {
                    feature: utilDisplayLabel(entities[0], context),
                    feature2: utilDisplayLabel(entities[1], context)
                };

                var fixes = [];
                if (canConnect) {
                    fixes.push(new validationIssueFix({
                        title: t('issues.fix.add_connection_vertex.title'),
                        onClick: function() {
                            var loc = this.issue.coordinates;
                            var ways = this.issue.info.ways;

                            context.perform(
                                function actionConnectCrossingWays(graph) {

                                    var node = osmNode();
                                    graph = graph.replace(node);

                                    var way0 = graph.entity(ways[0].id);
                                    var choice0 = geoChooseEdge(graph.childNodes(way0), loc, context.projection);
                                    var edge0 = [way0.nodes[choice0.index - 1], way0.nodes[choice0.index]];
                                    graph = actionAddMidpoint({loc: choice0.loc, edge: edge0}, node)(graph);

                                    var way1 = graph.entity(ways[1].id);
                                    var choice1 = geoChooseEdge(graph.childNodes(way1), loc, context.projection);
                                    var edge1 = [way1.nodes[choice1.index - 1], way1.nodes[choice1.index]];
                                    graph = actionAddMidpoint({loc: choice1.loc, edge: edge1}, node)(graph);

                                    return graph;
                                },
                                t('issues.fix.add_connection_vertex.undo_redo')
                            );
                        }
                    }));
                }

                issues.push(new validationIssue({
                    type: ValidationIssueType.crossing_ways,
                    severity: ValidationIssueSeverity.warning,
                    message: t('issues.crossing_ways.message', messageDict),
                    tooltip: t('issues.crossing_ways.'+crossingTypeID+'.tip'),
                    entities: entities,
                    info: {'ways': crossing.ways},
                    coordinates: crossing.cross_point,
                    fixes: fixes
                }));
            }
        }

        return issues;
    };


    return validation;
}

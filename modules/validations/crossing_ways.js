import { actionAddMidpoint } from '../actions/add_midpoint';
import { actionChangeTags } from '../actions/change_tags';
import { actionMergeNodes } from '../actions/merge_nodes';
import { actionSplit } from '../actions/split';
import { modeSelect } from '../modes/select';
import { geoAngle, geoExtent, geoLatToMeters, geoLonToMeters, geoLineIntersection,
    geoSphericalClosestNode, geoSphericalDistance, geoVecAngle, geoVecLength, geoMetersToLat, geoMetersToLon } from '../geo';
import { osmNode } from '../osm/node';
import { osmFlowingWaterwayTagValues, osmPathHighwayTagValues, osmRailwayTrackTagValues, osmRoutableHighwayTagValues } from '../osm/tags';
import { t } from '../util/locale';
import { utilDisplayLabel } from '../util';
import { validationIssue, validationIssueFix } from '../core/validation';


export function validationCrossingWays(context) {
    var type = 'crossing_ways';

    // returns the way or its parent relation, whichever has a useful feature type
    function getFeatureWithFeatureTypeTagsForWay(way, graph) {
        if (getFeatureTypeForTags(way.tags) === null) {
            // if the way doesn't match a feature type, check its parent relations
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

    function taggedAsIndoor(tags) {
        return hasTag(tags, 'indoor') ||
            hasTag(tags, 'level') ||
            tags.highway === 'corridor';
    }

    function allowsBridge(featureType) {
        return featureType === 'highway' || featureType === 'railway' || featureType === 'waterway';
    }
    function allowsTunnel(featureType) {
        return featureType === 'highway' || featureType === 'railway' || featureType === 'waterway';
    }


    function getFeatureTypeForCrossingCheck(way, graph) {
        var tags = getFeatureWithFeatureTypeTagsForWay(way, graph).tags;
        return getFeatureTypeForTags(tags);
    }

    // blacklist
    var ignoredBuildings = {
        demolished: true, dismantled: true, proposed: true, razed: true
    };


    function getFeatureTypeForTags(tags) {
        if (hasTag(tags, 'building') && !ignoredBuildings[tags.building]) return 'building';

        // don't check non-building areas
        if (hasTag(tags, 'area')) return null;

        if (hasTag(tags, 'highway') && osmRoutableHighwayTagValues[tags.highway]) return 'highway';
        if (hasTag(tags, 'railway') && osmRailwayTrackTagValues[tags.railway]) return 'railway';
        if (hasTag(tags, 'waterway') && osmFlowingWaterwayTagValues[tags.waterway]) return 'waterway';

        return null;
    }


    function isLegitCrossing(way1, featureType1, way2, featureType2) {
        var tags1 = way1.tags;
        var tags2 = way2.tags;

        // assume 0 by default
        var level1 = tags1.level || '0';
        var level2 = tags2.level || '0';

        if (taggedAsIndoor(tags1) && taggedAsIndoor(tags2) && level1 !== level2) {
            // assume features don't interact if they're indoor on different levels
            return true;
        }

        // assume 0 by default; don't use way.layer() since we account for structures here
        var layer1 = tags1.layer || '0';
        var layer2 = tags2.layer || '0';

        if (allowsBridge(featureType1) && allowsBridge(featureType2)) {
            if (hasTag(tags1, 'bridge') && !hasTag(tags2, 'bridge')) return true;
            if (!hasTag(tags1, 'bridge') && hasTag(tags2, 'bridge')) return true;
            // crossing bridges must use different layers
            if (hasTag(tags1, 'bridge') && hasTag(tags2, 'bridge') && layer1 !== layer2) return true;
        } else if (allowsBridge(featureType1) && hasTag(tags1, 'bridge')) return true;
        else if (allowsBridge(featureType2) && hasTag(tags2, 'bridge')) return true;

        if (allowsTunnel(featureType1) && allowsTunnel(featureType2)) {
            if (hasTag(tags1, 'tunnel') && !hasTag(tags2, 'tunnel')) return true;
            if (!hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel')) return true;
            // crossing tunnels must use different layers
            if (hasTag(tags1, 'tunnel') && hasTag(tags2, 'tunnel') && layer1 !== layer2) return true;
        } else if (allowsTunnel(featureType1) && hasTag(tags1, 'tunnel')) return true;
        else if (allowsTunnel(featureType2) && hasTag(tags2, 'tunnel')) return true;

        // don't flag crossing waterways and pier/highways
        if (featureType1 === 'waterway' && featureType2 === 'highway' && tags2.man_made === 'pier') return true;
        if (featureType2 === 'waterway' && featureType1 === 'highway' && tags1.man_made === 'pier') return true;

        if (featureType1 === 'building' || featureType2 === 'building') {
            // for building crossings, different layers are enough
            if (layer1 !== layer2) return true;
        }
        return false;
    }


    // highway values for which we shouldn't recommend connecting to waterways
    var highwaysDisallowingFords = {
        motorway: true, motorway_link: true, trunk: true, trunk_link: true,
        primary: true, primary_link: true, secondary: true, secondary_link: true
    };
    var nonCrossingHighways = { track: true };

    function tagsForConnectionNodeIfAllowed(entity1, entity2) {
        var featureType1 = getFeatureTypeForTags(entity1.tags);
        var featureType2 = getFeatureTypeForTags(entity2.tags);
        if (featureType1 === featureType2) {
            if (featureType1 === 'highway') {
                var entity1IsPath = osmPathHighwayTagValues[entity1.tags.highway];
                var entity2IsPath = osmPathHighwayTagValues[entity2.tags.highway];
                if ((entity1IsPath || entity2IsPath) && entity1IsPath !== entity2IsPath) {
                    // one feature is a path but not both

                    var roadFeature = entity1IsPath ? entity2 : entity1;
                    if (nonCrossingHighways[roadFeature.tags.highway]) {
                        // don't mark path connections with certain roads as crossings
                        return {};
                    }
                    var pathFeature = entity1IsPath ? entity1 : entity2;
                    if (['marked', 'unmarked'].indexOf(pathFeature.tags.crossing) !== -1) {
                        // if the path is a crossing, match the crossing type
                        return { highway: 'crossing', crossing: pathFeature.tags.crossing };
                    }
                    // don't add a `crossing` subtag to ambiguous crossings
                    return { highway: 'crossing' };
                }
                return {};
            }
            if (featureType1 === 'waterway') return {};
            if (featureType1 === 'railway') return {};

        } else {
            var featureTypes = [featureType1, featureType2];
            if (featureTypes.indexOf('highway') !== -1) {
                if (featureTypes.indexOf('railway') !== -1) {
                    if (osmPathHighwayTagValues[entity1.tags.highway] ||
                        osmPathHighwayTagValues[entity2.tags.highway]) {
                        // path-rail connections use this tag
                        return { railway: 'crossing' };
                    } else {
                        // road-rail connections use this tag
                        return { railway: 'level_crossing' };
                    }
                }

                if (featureTypes.indexOf('waterway') !== -1) {
                    // do not allow fords on structures
                    if (hasTag(entity1.tags, 'tunnel') && hasTag(entity2.tags, 'tunnel')) return null;
                    if (hasTag(entity1.tags, 'bridge') && hasTag(entity2.tags, 'bridge')) return null;

                    if (highwaysDisallowingFords[entity1.tags.highway] ||
                        highwaysDisallowingFords[entity2.tags.highway]) {
                        // do not allow fords on major highways
                        return null;
                    }
                    return { ford: 'yes' };
                }
            }
        }
        return null;
    }


    function findCrossingsByWay(way1, graph, tree) {
        var edgeCrossInfos = [];
        if (way1.type !== 'way') return edgeCrossInfos;

        var way1FeatureType = getFeatureTypeForCrossingCheck(way1, graph);
        if (way1FeatureType === null) return edgeCrossInfos;

        var checkedSingleCrossingWays = {};

        // declare vars ahead of time to reduce garbage collection
        var i, j, nodeIndex;
        var extent;
        var n1, n2, nA, nB;
        var segment1, segment2;
        var oneOnly;
        var intersected, way2, way2FeatureType, way2Nodes;
        var way1Nodes = graph.childNodes(way1);
        var comparedWays = {};
        for (i = 0; i < way1Nodes.length - 1; i++) {
            n1 = way1Nodes[i];
            n2 = way1Nodes[i + 1];
            extent = geoExtent([
                [
                    Math.min(n1.loc[0], n2.loc[0]),
                    Math.min(n1.loc[1], n2.loc[1])
                ],
                [
                    Math.max(n1.loc[0], n2.loc[0]),
                    Math.max(n1.loc[1], n2.loc[1])
                ]
            ]);

            intersected = tree.intersects(extent, graph);
            for (j = 0; j < intersected.length; j++) {
                way2 = intersected[j];

                if (way2.type !== 'way') continue;

                // don't check for self-intersection in this validation
                if (way2.id === way1.id) continue;

                // skip if this way was already checked and only one issue is needed
                if (checkedSingleCrossingWays[way2.id]) continue;

                // mark this way as checked even if there are no crossings
                comparedWays[way2.id] = true;

                // only check crossing highway, waterway, building, and railway
                way2FeatureType = getFeatureTypeForCrossingCheck(way2, graph);
                if (way2FeatureType === null ||
                    isLegitCrossing(way1, way1FeatureType, way2, way2FeatureType)) {
                    continue;
                }

                // create only one issue for building crossings
                oneOnly = way1FeatureType === 'building' || way2FeatureType === 'building';
                segment1 = [n1.loc, n2.loc];

                way2Nodes = graph.childNodes(way2);
                for (nodeIndex = 0; nodeIndex < way2Nodes.length - 1; nodeIndex++) {
                    nA = way2Nodes[nodeIndex];
                    nB = way2Nodes[nodeIndex + 1];
                    if (nA.id === n1.id || nA.id === n2.id ||
                        nB.id === n1.id || nB.id === n2.id) {
                        // n1 or n2 is a connection node; skip
                        continue;
                    }
                    segment2 = [nA.loc, nB.loc];
                    var point = geoLineIntersection(segment1, segment2);
                    if (point) {
                        edgeCrossInfos.push({
                            wayInfos: [
                                {
                                    way: way1,
                                    featureType: way1FeatureType,
                                    edge: [n1.id, n2.id]
                                },
                                {
                                    way: way2,
                                    featureType: way2FeatureType,
                                    edge: [nA.id, nB.id]
                                }
                            ],
                            crossPoint: point
                        });
                        if (oneOnly) {
                            checkedSingleCrossingWays[way2.id] = true;
                            break;
                        }
                    }
                }
            }
        }
        return edgeCrossInfos;
    }


    function waysToCheck(entity, graph) {
        if (!getFeatureTypeForTags(entity.tags)) {
            return [];
        }
        if (entity.type === 'way') {
            return [entity];
        } else if (entity.type === 'relation' &&
            entity.isMultipolygon() &&
            // only check multipolygons if they are buildings
            hasTag(entity.tags, 'building')) {
            return entity.members.reduce(function(array, member) {
                if (member.type === 'way' &&
                    //(member.role === 'outer' || member.role === 'inner') &&
                    graph.hasEntity(member.id)) {
                    var entity = graph.entity(member.id);
                    array.push(entity);
                }
                return array;
            }, []);
        }
        return [];
    }


    var validation = function checkCrossingWays(entity, graph) {

        var tree = context.history().tree();

        var ways = waysToCheck(entity, graph);

        var issues = [];
        // declare these here to reduce garbage collection
        var wayIndex, crossingIndex, crossings;
        for (wayIndex in ways) {
            crossings = findCrossingsByWay(ways[wayIndex], graph, tree);
            for (crossingIndex in crossings) {
                issues.push(createIssue(crossings[crossingIndex], graph));
            }
        }
        return issues;
    };


    function createIssue(crossing, graph) {

        // use the entities with the tags that define the feature type
        crossing.wayInfos.sort(function(way1Info, way2Info) {
            var type1 = way1Info.featureType;
            var type2 = way2Info.featureType;
            if (type1 === type2) {
                return utilDisplayLabel(way1Info.way, context) > utilDisplayLabel(way2Info.way, context);
            } else if (type1 === 'waterway') {
                return true;
            } else if (type2 === 'waterway') {
                return false;
            }
            return type1 < type2;
        });
        var entities = crossing.wayInfos.map(function(wayInfo) {
            return getFeatureWithFeatureTypeTagsForWay(wayInfo.way, graph);
        });
        var edges = [crossing.wayInfos[0].edge, crossing.wayInfos[1].edge];
        var featureTypes = [crossing.wayInfos[0].featureType, crossing.wayInfos[1].featureType];

        var connectionTags = tagsForConnectionNodeIfAllowed(entities[0], entities[1]);

        var featureType1 = crossing.wayInfos[0].featureType;
        var featureType2 = crossing.wayInfos[1].featureType;

        var isCrossingIndoors = taggedAsIndoor(entities[0].tags) && taggedAsIndoor(entities[1].tags);
        var isCrossingTunnels = allowsTunnel(featureType1) && hasTag(entities[0].tags, 'tunnel') &&
                                allowsTunnel(featureType2) && hasTag(entities[1].tags, 'tunnel');
        var isCrossingBridges = allowsBridge(featureType1) && hasTag(entities[0].tags, 'bridge') &&
                                allowsBridge(featureType2) && hasTag(entities[1].tags, 'bridge');

        var subtype = [featureType1, featureType2].sort().join('-');

        var crossingTypeID = subtype;

        if (isCrossingIndoors) {
            crossingTypeID = 'indoor-indoor';
        } else if (isCrossingTunnels) {
            crossingTypeID = 'tunnel-tunnel';
        } else if (isCrossingBridges) {
            crossingTypeID = 'bridge-bridge';
        }
        if (connectionTags && (isCrossingIndoors || isCrossingTunnels || isCrossingBridges)) {
            crossingTypeID += '_connectable';
        }

        return new validationIssue({
            type: type,
            subtype: subtype,
            severity: 'warning',
            message: function(context) {
                var entity1 = context.hasEntity(this.entityIds[0]),
                    entity2 = context.hasEntity(this.entityIds[1]);
                return (entity1 && entity2) ? t('issues.crossing_ways.message', {
                    feature: utilDisplayLabel(entity1, context),
                    feature2: utilDisplayLabel(entity2, context)
                }) : '';
            },
            reference: showReference,
            entityIds: entities.map(function(entity) {
                return entity.id;
            }),
            data: {
                edges: edges,
                featureTypes: featureTypes,
                connectionTags: connectionTags
            },
            // differentiate based on the loc since two ways can cross multiple times
            hash: crossing.crossPoint.toString() +
                // if the edges change then so does the fix
                edges.slice().sort(function(edge1, edge2) {
                    // order to assure hash is deterministic
                    return edge1[0] < edge2[0] ? -1 : 1;
                }).toString() +
                // ensure the correct connection tags are added in the fix
                JSON.stringify(connectionTags),
            loc: crossing.crossPoint,
            dynamicFixes: function() {
                var mode = context.mode();
                if (!mode || mode.id !== 'select' || mode.selectedIDs().length !== 1) return [];

                var selectedIndex = this.entityIds[0] === mode.selectedIDs()[0] ? 0 : 1;
                var selectedFeatureType = this.data.featureTypes[selectedIndex];

                var fixes = [];

                if (connectionTags) {
                    fixes.push(makeConnectWaysFix(this.data.connectionTags));
                }

                if (isCrossingIndoors) {
                    fixes.push(new validationIssueFix({
                        icon: 'iD-icon-layers',
                        title: t('issues.fix.use_different_levels.title')
                    }));
                } else if (isCrossingTunnels ||
                    isCrossingBridges ||
                    featureType1 === 'building' ||
                    featureType2 === 'building')  {

                    fixes.push(makeChangeLayerFix('higher'));
                    fixes.push(makeChangeLayerFix('lower'));
                } else {
                    // don't recommend adding bridges to waterways since they're uncommmon
                    if (allowsBridge(selectedFeatureType) && selectedFeatureType !== 'waterway') {
                        fixes.push(makeAddBridgeOrTunnelFix('add_a_bridge', 'temaki-bridge', 'bridge'));
                    }

                    if (allowsTunnel(selectedFeatureType)) {
                        fixes.push(makeAddBridgeOrTunnelFix('add_a_tunnel', 'temaki-tunnel', 'tunnel'));
                    }
                }

                // repositioning the features is always an option
                fixes.push(new validationIssueFix({
                    icon: 'iD-operation-move',
                    title: t('issues.fix.reposition_features.title')
                }));

                return fixes;
            }
        });

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .text(t('issues.crossing_ways.' + crossingTypeID + '.reference'));
        }
    }

    function makeAddBridgeOrTunnelFix(fixTitleID, iconName, bridgeOrTunnel){
        return new validationIssueFix({
            icon: iconName,
            title: t('issues.fix.' + fixTitleID + '.title'),
            onClick: function(context) {
                var mode = context.mode();
                if (!mode || mode.id !== 'select') return;

                var selectedIDs = mode.selectedIDs();
                if (selectedIDs.length !== 1) return;

                var selectedWayID = selectedIDs[0];
                if (!context.hasEntity(selectedWayID)) return;

                var resultWayIDs = [selectedWayID];

                var edge, crossedEdge, crossedWayID;
                if (this.issue.entityIds[0] === selectedWayID) {
                    edge = this.issue.data.edges[0];
                    crossedEdge = this.issue.data.edges[1];
                    crossedWayID = this.issue.entityIds[1];
                } else {
                    edge = this.issue.data.edges[1];
                    crossedEdge = this.issue.data.edges[0];
                    crossedWayID = this.issue.entityIds[0];
                }

                var crossingLoc = this.issue.loc;

                var projection = context.projection;

                var action = function actionAddStructure(graph) {

                    var edgeNodes = [graph.entity(edge[0]), graph.entity(edge[1])];

                    var crossedWay = graph.hasEntity(crossedWayID);
                    // use the explicit width of the crossed feature as the structure length, if available
                    var structLengthMeters = crossedWay && crossedWay.tags.width && parseFloat(crossedWay.tags.width);
                    if (!structLengthMeters) {
                        // if no explicit width is set, approximate the width based on the tags
                        structLengthMeters = crossedWay && crossedWay.impliedLineWidthMeters();
                    }
                    if (structLengthMeters) {
                        if (getFeatureTypeForTags(crossedWay.tags) === 'railway') {
                            // bridges over railways are generally much longer than the rail bed itself, compensate
                            structLengthMeters *= 2;
                        }
                    } else {
                        // should ideally never land here since all rail/water/road tags should have an implied width
                        structLengthMeters = 8;
                    }

                    var a1 = geoAngle(edgeNodes[0], edgeNodes[1], projection) + Math.PI;
                    var a2 = geoAngle(graph.entity(crossedEdge[0]), graph.entity(crossedEdge[1]), projection) + Math.PI;
                    var crossingAngle = Math.max(a1, a2) - Math.min(a1, a2);
                    if (crossingAngle > Math.PI) crossingAngle -= Math.PI;
                    // lengthen the structure to account for the angle of the crossing
                    structLengthMeters = ((structLengthMeters / 2) / Math.sin(crossingAngle)) * 2;

                    // add padding since the structure must extend past the edges of the crossed feature
                    structLengthMeters += 4;

                    // clamp the length to a reasonable range
                    structLengthMeters = Math.min(Math.max(structLengthMeters, 4), 50);

                    function geomToProj(geoPoint) {
                        return [
                            geoLonToMeters(geoPoint[0], geoPoint[1]),
                            geoLatToMeters(geoPoint[1])
                        ];
                    }
                    function projToGeom(projPoint) {
                        var lat = geoMetersToLat(projPoint[1]);
                        return [
                            geoMetersToLon(projPoint[0], lat),
                            lat
                        ];
                    }

                    var projEdgeNode1 = geomToProj(edgeNodes[0].loc);
                    var projEdgeNode2 = geomToProj(edgeNodes[1].loc);

                    var projectedAngle = geoVecAngle(projEdgeNode1, projEdgeNode2);

                    var projectedCrossingLoc = geomToProj(crossingLoc);
                    var linearToSphericalMetersRatio = geoVecLength(projEdgeNode1, projEdgeNode2) /
                        geoSphericalDistance(edgeNodes[0].loc, edgeNodes[1].loc);

                    function locSphericalDistanceFromCrossingLoc(angle, distanceMeters) {
                        var lengthSphericalMeters = distanceMeters * linearToSphericalMetersRatio;
                        return projToGeom([
                            projectedCrossingLoc[0] + Math.cos(angle) * lengthSphericalMeters,
                            projectedCrossingLoc[1] + Math.sin(angle) * lengthSphericalMeters
                        ]);
                    }

                    var endpointLocGetter1 = function(lengthMeters) {
                        return locSphericalDistanceFromCrossingLoc(projectedAngle, lengthMeters);
                    };
                    var endpointLocGetter2 = function(lengthMeters) {
                        return locSphericalDistanceFromCrossingLoc(projectedAngle + Math.PI, lengthMeters);
                    };

                    // avoid creating very short edges from splitting too close to another node
                    var minEdgeLengthMeters = 0.55;

                    // decide where to bound the structure along the way, splitting as necessary
                    function determineEndpoint(edge, endNode, locGetter) {
                        var newNode;

                        var idealLengthMeters = structLengthMeters / 2;

                        // distance between the crossing location and the end of the edge,
                        // the maximum length of this side of the structure
                        var crossingToEdgeEndDistance = geoSphericalDistance(crossingLoc, endNode.loc);

                        if (crossingToEdgeEndDistance - idealLengthMeters > minEdgeLengthMeters) {
                            // the edge is long enough to insert a new node

                            // the loc that would result in the full expected length
                            var idealNodeLoc = locGetter(idealLengthMeters);

                            newNode = osmNode();
                            graph = actionAddMidpoint({ loc: idealNodeLoc, edge: edge }, newNode)(graph);

                        } else {
                            var edgeCount = 0;
                            endNode.parentIntersectionWays(graph).forEach(function(way) {
                                way.nodes.forEach(function(nodeID) {
                                    if (nodeID === endNode.id) {
                                        if ((endNode.id === way.first() && endNode.id !== way.last()) ||
                                            (endNode.id === way.last() && endNode.id !== way.first())) {
                                            edgeCount += 1;
                                        } else {
                                            edgeCount += 2;
                                        }
                                    }
                                });
                            });

                            if (edgeCount >= 3) {
                                // the end node is a junction, try to leave a segment
                                // between it and the structure - #7202

                                var insetLength = crossingToEdgeEndDistance - minEdgeLengthMeters;
                                if (insetLength > minEdgeLengthMeters) {
                                    var insetNodeLoc = locGetter(insetLength);
                                    newNode = osmNode();
                                    graph = actionAddMidpoint({ loc: insetNodeLoc, edge: edge }, newNode)(graph);
                                }
                            }
                        }

                        // if the edge is too short to subdivide as desired, then
                        // just bound the structure at the existing end node
                        if (!newNode) newNode = endNode;

                        var splitAction = actionSplit(newNode.id)
                            .limitWays(resultWayIDs); // only split selected or created ways

                        // do the split
                        graph = splitAction(graph);
                        if (splitAction.getCreatedWayIDs().length) {
                            resultWayIDs.push(splitAction.getCreatedWayIDs()[0]);
                        }

                        return newNode;
                    }

                    var structEndNode1 = determineEndpoint(edge, edgeNodes[1], endpointLocGetter1);
                    var structEndNode2 = determineEndpoint([edgeNodes[0].id, structEndNode1.id], edgeNodes[0], endpointLocGetter2);

                    var structureWay = resultWayIDs.map(function(id) {
                        return graph.entity(id);
                    }).find(function(way) {
                        return way.nodes.indexOf(structEndNode1.id) !== -1 &&
                            way.nodes.indexOf(structEndNode2.id) !== -1;
                    });

                    var tags = Object.assign({}, structureWay.tags); // copy tags
                    if (bridgeOrTunnel === 'bridge'){
                        tags.bridge = 'yes';
                        tags.layer = '1';
                    } else {
                        var tunnelValue = 'yes';
                        if (getFeatureTypeForTags(tags) === 'waterway') {
                            // use `tunnel=culvert` for waterways by default
                            tunnelValue = 'culvert';
                        }
                        tags.tunnel = tunnelValue;
                        tags.layer = '-1';
                    }
                    // apply the structure tags to the way
                    graph = actionChangeTags(structureWay.id, tags)(graph);
                    return graph;
                };

                context.perform(action, t('issues.fix.' + fixTitleID + '.annotation'));
                context.enter(modeSelect(context, resultWayIDs));
            }
        });
    }



    function makeConnectWaysFix(connectionTags) {

        var fixTitleID = 'connect_features';
        if (connectionTags.ford) {
            fixTitleID = 'connect_using_ford';
        }

        return new validationIssueFix({
            icon: 'iD-icon-crossing',
            title: t('issues.fix.' + fixTitleID + '.title'),
            onClick: function(context) {
                var loc = this.issue.loc;
                var connectionTags = this.issue.data.connectionTags;
                var edges = this.issue.data.edges;

                context.perform(
                    function actionConnectCrossingWays(graph) {
                        // create the new node for the points
                        var node = osmNode({ loc: loc, tags: connectionTags });
                        graph = graph.replace(node);

                        var nodesToMerge = [node.id];
                        var mergeThresholdInMeters = 0.75;

                        edges.forEach(function(edge) {
                            var edgeNodes = [graph.entity(edge[0]), graph.entity(edge[1])];
                            var closestNodeInfo = geoSphericalClosestNode(edgeNodes, loc);
                            // if there is already a point nearby, use that
                            if (closestNodeInfo.distance < mergeThresholdInMeters) {
                                nodesToMerge.push(closestNodeInfo.node.id);
                            // else add the new node to the way
                            } else {
                                graph = actionAddMidpoint({loc: loc, edge: edge}, node)(graph);
                            }
                        });

                        if (nodesToMerge.length > 1) {
                            // if we're using nearby nodes, merge them with the new node
                            graph = actionMergeNodes(nodesToMerge, loc)(graph);
                        }

                        return graph;
                    },
                    t('issues.fix.connect_crossing_features.annotation')
                );
            }
        });
    }

    function makeChangeLayerFix(higherOrLower) {
        return new validationIssueFix({
            icon: 'iD-icon-' + (higherOrLower === 'higher' ? 'up' : 'down'),
            title: t('issues.fix.tag_this_as_' + higherOrLower + '.title'),
            onClick: function(context) {

                var mode = context.mode();
                if (!mode || mode.id !== 'select') return;

                var selectedIDs = mode.selectedIDs();
                if (selectedIDs.length !== 1) return;

                var selectedID = selectedIDs[0];
                if (!this.issue.entityIds.some(function(entityId) {
                    return entityId === selectedID;
                })) return;

                var entity = context.hasEntity(selectedID);
                if (!entity) return;

                var tags = Object.assign({}, entity.tags);   // shallow copy
                var layer = tags.layer && Number(tags.layer);
                if (layer && !isNaN(layer)) {
                    if (higherOrLower === 'higher') {
                        layer += 1;
                    } else {
                        layer -= 1;
                    }
                } else {
                    if (higherOrLower === 'higher') {
                        layer = 1;
                    } else {
                        layer = -1;
                    }
                }
                tags.layer = layer.toString();
                context.perform(
                    actionChangeTags(entity.id, tags),
                    t('operations.change_tags.annotation')
                );
            }
        });
    }

    validation.type = type;

    return validation;
}

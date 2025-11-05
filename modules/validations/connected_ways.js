import { isEqual } from 'lodash-es';

import { operationDisconnect } from '../operations/disconnect';
import { operationDelete } from '../operations/delete';
import { geoExtent, geoLineIntersection } from '../geo';
import { osmFlowingWaterwayTagValues, osmRailwayTrackTagValues, osmPowerTagValues, osmRoutableAerowayTags, osmRoutableHighwayTagValues } from '../osm/tags';
import { t } from '../core/localizer';
import { utilDisplayLabel } from '../util/utilDisplayLabel';
import { validationIssue, validationIssueFix } from '../core/validation';

export function validationConnectedWays(context) {
    const type = 'connected_ways';

    // returns the way or its parent relation, whichever has a useful feature type
    function getFeatureWithFeatureTypeTagsForWay(way, graph) {
        if (getFeatureType(way, graph) !== null) return way;
        // if the way doesn't match a feature type, check its parent relations
        for (const rel of graph.parentRelations(way)) {
            if (getFeatureType(rel, graph) !== null) return rel;
        }
    }

    function hasTag(tags, key) {
        return tags[key] !== undefined && tags[key] !== 'no';
    }

    // discard
    const ignoredBuildings = {
        demolished: true, dismantled: true, proposed: true, razed: true
    };

    function getFeatureType(entity, graph) {
        const geometry = entity.geometry(graph);
        if (geometry !== 'line' && geometry !== 'area') return null;

        const tags = entity.tags;

        if (tags.aeroway in osmRoutableAerowayTags) return 'aeroway';

        if (hasTag(tags, 'building') && !ignoredBuildings[tags.building]) return 'building';
        if (hasTag(tags, 'highway') && osmRoutableHighwayTagValues[tags.highway]) return 'highway';
        if (hasTag(tags, 'landuse')) return 'landuse';
        if (hasTag(tags, 'natural')) return 'natural';
        if (hasTag(tags, 'man_made')) return 'man_made';

        // don't check railway or waterway areas
        if (geometry !== 'line') return null;

        if (hasTag(tags, 'railway') && osmRailwayTrackTagValues[tags.railway]) return 'railway';
        if (hasTag(tags, 'waterway') && osmFlowingWaterwayTagValues[tags.waterway]) return 'waterway';

        if (hasTag(tags, 'power') && osmPowerTagValues[tags.power]) return 'power';
        //if (hasTag(tags, 'disused:power') && osmPowerTagValues[tags.power]) return 'power';
        //if (hasTag(tags, 'construction:power') && osmPowerTagValues[tags["construction:power"]]) return 'power';

        return null;
    }

    /**
     * @returns {object | null} the tags for the connecting node, or null if the entities should not be joined
     */
    function tagsForConnectionNodeIfAllowed(entity1, entity2, graph) {
        const featureType1 = getFeatureType(entity1, graph);
        const featureType2 = getFeatureType(entity2, graph);

        /**
         * @typedef {NonNullable<ReturnType<getFeatureType>>} FeatureType
         * @type {`${FeatureType}-${FeatureType}`}
         */
        const featureTypes = [featureType1, featureType2].sort().join('-');

        if (featureTypes === 'building-power') {
            return { power: 'terminal', line_attachment: 'anchor' };
        }

        return null;
    }

    function findConnectionOnWay(way1, graph, tree) {
        const ConnectionsInfo = [];
        if (way1.type !== 'way') return ConnectionsInfo;

        const taggedFeature1 = getFeatureWithFeatureTypeTagsForWay(way1, graph);
        const way1FeatureType = getFeatureType(taggedFeature1, graph);
        if (way1FeatureType === null) return ConnectionsInfo;

        if (way1FeatureType !== 'power') return ConnectionsInfo;

        const checkedSingleCrossingWays = {};

        // declare vars ahead of time to reduce garbage collection
        let i;
        let nA, nB, nAId, nBId, intersectingNode;
        let segment1, segment2;
        let oneOnly;
        let way2, taggedFeature2, way2FeatureType;
        const way1Nodes = graph.childNodes(way1);
        const way1NodesId = way1Nodes.map(n => n.id);
        const comparedWays = {};
        for (i = 0; i < way1Nodes.length - 1; i++) {
            const n1 = way1Nodes[i];
            const n2 = way1Nodes[i + 1];
            const extent = geoExtent([
                [
                    Math.min(n1.loc[0], n2.loc[0]),
                    Math.min(n1.loc[1], n2.loc[1])
                ],
                [
                    Math.max(n1.loc[0], n2.loc[0]),
                    Math.max(n1.loc[1], n2.loc[1])
                ]
            ]);

            // Optimize by only checking overlapping segments, not every segment
            // of overlapping ways
            for (const segment2Info of tree.waySegments(extent, graph)) {

                // don't check for self-intersection in this validation
                if (segment2Info.wayId === way1.id) continue;

                // skip if this way was already checked and only one issue is needed
                if (checkedSingleCrossingWays[segment2Info.wayId]) continue;

                // mark this way as checked even if there are no crossings
                comparedWays[segment2Info.wayId] = true;

                way2 = graph.hasEntity(segment2Info.wayId);
                if (!way2) continue;
                taggedFeature2 = getFeatureWithFeatureTypeTagsForWay(way2, graph);
                way2FeatureType = getFeatureType(taggedFeature2, graph);

                if (way2FeatureType === null || (way1FeatureType === 'power' && way2FeatureType === 'power')){
                    continue;
                }

                // create only one issue for building crossings
                oneOnly = way1FeatureType === 'building' || way2FeatureType === 'building';

                nAId = segment2Info.nodes[0];
                nBId = segment2Info.nodes[1];
                intersectingNode = null;
                const hasConnectionNode = (nAId === n1.id || nAId === n2.id || nBId === n1.id || nBId === n2.id);
                if (!hasConnectionNode) {
                    continue;
                }
                // check tags of intersecting node
                intersectingNode = [nAId, nBId].find(id => id === n1.id || id === n2.id);
                let intersectingNodeEntity = graph.entity(intersectingNode);
                if (way1FeatureType === 'power' || way2FeatureType === 'power') {
                    if (['insulator', 'terminal'].includes(intersectingNodeEntity.tags.power)) {
                        continue;
                    }
                }

                nA = graph.hasEntity(nAId);
                if (!nA) continue;
                nB = graph.hasEntity(nBId);
                if (!nB) continue;

                segment1 = [n1.loc, n2.loc];
                segment2 = [nA.loc, nB.loc];
                const point = geoLineIntersection(segment1, segment2);
                if (point) {
                    ConnectionsInfo.push({
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
                        crossPoint: point,
                        crossIndex: way1NodesId.indexOf(intersectingNode),
                        crossNode: intersectingNode
                    });
                    if (oneOnly) {
                        checkedSingleCrossingWays[way2.id] = true;
                        break;
                    }
                }
            }
        }
        return ConnectionsInfo;
    }

    function waysToCheck(entity, graph) {
        const featureType = getFeatureType(entity, graph);
        if (!featureType) return [];

        if (entity.type === 'way') {
            return [entity];
        } else if (entity.type === 'relation') {
            return entity.members.reduce(function(array, member) {
                if (member.type === 'way' &&
                    // only look at geometry ways
                    (!member.role || member.role === 'outer' || member.role === 'inner')) {
                    const entity = graph.hasEntity(member.id);
                    // don't add duplicates
                    if (entity && !array.includes(entity)) {
                        array.push(entity);
                    }
                }
                return array;
            }, []);
        }
        return [];
    }

    const validation = function (entity, graph) {
        const tree = context.history().tree();
        const issues = [];
        for (const way of waysToCheck(entity, graph)) {
            for (const connection of findConnectionOnWay(way, graph, tree)) {
                issues.push(createIssue(connection, graph));
            }
        }
        return issues;
    };

    function createIssue(wrongConnection, graph) {

        // use the entities with the tags that define the feature type
        const wayInfosSorted = wrongConnection.wayInfos.sort((way1Info, way2Info) => {
            const type1 = way1Info.featureType;
            const type2 = way2Info.featureType;
            if (type1 === type2) {
                return utilDisplayLabel(way1Info.way, graph) > utilDisplayLabel(way2Info.way, graph);
            } else if (type1 === 'waterway') {
                return true;
            } else if (type2 === 'waterway') {
                return false;
            }
            return type1 < type2;
        });
        const entities = wayInfosSorted.map(wayInfo => getFeatureWithFeatureTypeTagsForWay(wayInfo.way, graph));
        const edges = wayInfosSorted.map(w => w.edge);
        const featureTypes = wayInfosSorted.map(w => w.featureType);

        const connectionTags = tagsForConnectionNodeIfAllowed(entities[0], entities[1], graph);

        const featureType1 = wayInfosSorted[0].featureType;
        const featureType2 = wayInfosSorted[1].featureType;

        const isCrossingPower = entities.some(e => hasTag(e.tags, 'power'));

        const subtype = featureTypes.sort().join('-');

        let crossingTypeID = subtype;

        if (isCrossingPower && subtype !== 'building-power') {
            crossingTypeID = 'power-other';
        }
        if (connectionTags && isCrossingPower) {
            crossingTypeID += '_connectable';
        }

        // Differentiate based on the loc rounded to 4 digits, since two ways can cross multiple times.
        const uniqueID = wrongConnection.crossPoint[0].toFixed(4) + ',' + wrongConnection.crossPoint[1].toFixed(4);

        return new validationIssue({
            type: type,
            subtype: subtype,
            severity: 'warning',
            message: function(context) {
                const graph = context.graph();
                const entity1 = graph.hasEntity(this.entityIds[0]),
                    entity2 = graph.hasEntity(this.entityIds[1]);
                return (entity1 && entity2) ? t.append('issues.connected_ways.message', {
                    feature: utilDisplayLabel(entity1, graph, featureType1 === 'building'),
                    feature2: utilDisplayLabel(entity2, graph, featureType2 === 'building')
                }) : '';
            },
            reference: showReference,
            entityIds: entities.map(entity => entity.id),
            data: {
                edges,
                featureTypes,
                connectingNode: wrongConnection.crossNode,
                connectingNodeIndex: wrongConnection.crossIndex,
                connectionTags
            },
            hash: uniqueID,
            loc: wrongConnection.crossPoint,
            dynamicFixes: function(context) {
                const mode = context.mode();
                if (!mode || mode.id !== 'select' || mode.selectedIDs().length !== 1) return [];

                const fixes = [];

                fixes.push(new validationIssueFix({
                    icon: 'iD-operation-delete',
                    title: t.append('issues.fix.disconnect_feature.title'),
                    entityIds: [this.data.connectingNode],
                    onClick: function(context) {
                        const graph = context.graph();
                        const powerEntity = this.issue.entityIds.map(id => graph.entity(id)).find(e => hasTag(e.tags, 'power'));
                        const operation = operationDisconnect(context, [this.issue.data.connectingNode, powerEntity.id]);
                        if (!operation.disabled()) {
                            operation();
                        }
                        //reload graph and delete the node from powerEntity
                        const graph_ = context.graph();
                        const entity1_ = graph_.entity(this.issue.entityIds[0]);
                        const entity2_ = graph_.entity(this.issue.entityIds[1]);
                        const powerEntity_ = hasTag(entity1_.tags, 'power') ? entity1_ : hasTag(entity2_.tags, 'power') ? entity2_ : null;
                        const operation_ = operationDelete(context, [powerEntity_.nodes[this.issue.data.connectingNodeIndex]]);
                        if (!operation_.disabled()) {
                            operation_();
                        }
                    }
                }));

                let wayNodes = graph.childNodes(entities[1]);
                if (featureType1 === 'power') {
                    wayNodes = graph.childNodes(entities[0]);
                }

                const connectingNodeIndex = this.data.connectingNodeIndex;
                const isLastNodeOfWay = (connectingNodeIndex === 0 || connectingNodeIndex === wayNodes.length - 1);

                if (connectionTags && isLastNodeOfWay) {
                    fixes.push(makeConnectWaysFix(this.data.connectionTags));
                    let lessLikelyConnectionTags = tagsForConnectionNodeIfAllowed(entities[0], entities[1], graph, true);
                    if (lessLikelyConnectionTags && !isEqual(connectionTags, lessLikelyConnectionTags)) {
                        fixes.push(makeConnectWaysFix(lessLikelyConnectionTags));
                    }
                }

                return fixes;
            }
        });

        function showReference(selection) {
            selection.selectAll('.issue-reference')
                .data([0])
                .enter()
                .append('div')
                .attr('class', 'issue-reference')
                .call(t.append('issues.connected_ways.' + crossingTypeID + '.reference'));
        }
    }

    function makeConnectWaysFix(connectionTags) {

        let fixTitleID = 'connect_features';
        let fixIcon = 'iD-icon-crossing';
        if (connectionTags.power) {
            fixTitleID = 'connect_using_power_terminal';
            fixIcon = 'temaki-power';
        }

        const fix = new validationIssueFix({
            icon: fixIcon,
            title: t.append('issues.fix.' + fixTitleID + '.title'),
            onClick: function(context) {
                const connectingNode = this.issue.data.connectingNode;

                if (connectingNode && connectionTags) {
                    const node = context.graph().entity(connectingNode);
                    if (!node) return;
                    const tags = {...node.tags, ...connectionTags};
                    context.perform(
                        graph => graph.replace(node.update({ tags } )),
                        t('issues.fix.' + fixTitleID + '.annotation')
                    );
                }
            }
        });
        fix._connectionTags = connectionTags;
        return fix;
    }

    validation.type = type;

    return validation;
}

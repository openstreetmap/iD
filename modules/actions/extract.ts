import { geoPath as d3_geoPath } from 'd3-geo';

import { osmNode } from '../osm/node';
import type { Action } from '../core/history';
import type { NodeId, OsmEntity } from '../osm';
import type { Projection } from '../geo/raw_mercator';
import type { coreGraph } from '../core';

export interface ActionExtract extends Action<boolean> {
    getExtractedNodeID(): NodeId;
}

export function actionExtract(entityID: NodeId, projection: Projection): ActionExtract {
    let extractedNodeID: NodeId;

    const action: ActionExtract = function (graph, _t, shiftKeyPressed) {
        const entity = graph.entity(entityID);

        if (entity.type === 'node') {
            return extractFromNode(entity, graph, shiftKeyPressed);
        }

        return extractFromWayOrRelation(entity, graph);
    };

    function extractFromNode(
        node: osmNode,
        graph: coreGraph,
        shiftKeyPressed: boolean | undefined,
    ) {
        extractedNodeID = node.id;

        // Create a new node to replace the one we will detach
        const replacement = new osmNode({ loc: node.loc });
        graph = graph.replace(replacement);

        // Process each way in turn, updating the graph as we go
        graph = graph.parentWays(node).reduce(function (accGraph, parentWay) {
            return accGraph.replace(parentWay.replaceNode(entityID, replacement.id));
        }, graph);

        if (!shiftKeyPressed) return graph;

        // Process any relations too
        // but only if the user holds down the shift key while triggering the operation.
        return graph.parentRelations(node).reduce(function (accGraph, parentRel) {
            return accGraph.replace(parentRel.replaceMember(node, replacement));
        }, graph);
    }

    function extractFromWayOrRelation(entity: OsmEntity, graph: coreGraph) {
        const fromGeometry = entity.geometry(graph);

        const keysToCopyAndRetain = ['source', 'wheelchair'];
        const keysToRetain = ['area'];
        const buildingKeysToRetain = [
            'architect',
            'building',
            'height',
            'layer',
            'nycdoitt:bin',
            'ref:GB:uprn',
            'ref:linz:building_id',
        ];

        let extractedLoc = d3_geoPath(projection).centroid(entity.asGeoJSON(graph));
        extractedLoc = extractedLoc && projection.invert(extractedLoc);
        if (!extractedLoc || !isFinite(extractedLoc[0]) || !isFinite(extractedLoc[1])) {
            extractedLoc = entity.extent(graph).center();
        }

        const indoorAreaValues: Record<TagValue, boolean> = {
            area: true,
            corridor: true,
            elevator: true,
            level: true,
            room: true,
        };

        const isBuilding =
            (entity.tags.building && entity.tags.building !== 'no') ||
            (entity.tags['building:part'] && entity.tags['building:part'] !== 'no');

        const isIndoorArea =
            fromGeometry === 'area' && entity.tags.indoor && indoorAreaValues[entity.tags.indoor];

        const entityTags = { ...entity.tags }; // shallow copy
        const pointTags: Tags = {};
        for (const key in entityTags) {
            if (entity.type === 'relation' && key === 'type') {
                continue;
            }

            if (keysToRetain.indexOf(key) !== -1) {
                continue;
            }

            if (isBuilding) {
                // don't transfer building-related tags
                if (
                    buildingKeysToRetain.indexOf(key) !== -1 ||
                    key.match(/^building:.{1,}/) ||
                    key.match(/^roof:.{1,}/)
                ) {
                    continue;
                }
            }
            // leave `indoor` tag on the area
            if (isIndoorArea && key === 'indoor') {
                continue;
            }

            // copy the tag from the entity to the point
            pointTags[key] = entityTags[key];

            // leave addresses and some other tags so they're on both features
            if (keysToCopyAndRetain.indexOf(key) !== -1 || key.match(/^addr:.{1,}/)) {
                continue;
            } else if (isIndoorArea && key === 'level') {
                // leave `level` on both features
                continue;
            }

            // remove the tag from the entity
            delete entityTags[key];
        }

        if (!isBuilding && !isIndoorArea && fromGeometry === 'area') {
            // ensure that areas keep area geometry
            entityTags.area = 'yes';
        }

        const replacement = new osmNode({ loc: extractedLoc, tags: pointTags });
        graph = graph.replace(replacement);

        extractedNodeID = replacement.id;

        return graph.replace(entity.update({ tags: entityTags }));
    }

    action.getExtractedNodeID = function () {
        return extractedNodeID;
    };

    return action;
}

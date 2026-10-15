import { geoPath as d3_geoPath } from 'd3-geo';

import { osmNode } from '../osm/node';
import { osmIsAddressKey, osmIsAddressPoint } from '../osm/tags';
import type { Action } from '../core/history';
import type { NodeId, OsmEntity } from '../osm';
import type { Projection } from '../geo/raw_mercator';
import type { coreGraph } from '../core';

export interface ActionExtract extends Action<boolean> {
    getExtractedNodeID(): NodeId;
}

const keysToCopyAndRetain = ['source', 'wheelchair'];
const keysToRetain = ['area'];
const buildingKeysToRetain = ['architect', 'building', 'height', 'layer', 'nycdoitt:bin', 'ref:GB:uprn', 'ref:linz:building_id'];

function isBuilding(entity: OsmEntity) {
    return (entity.tags.building && entity.tags.building !== 'no') ||
        (entity.tags['building:part'] && entity.tags['building:part'] !== 'no');
}

function isBuildingKey(key: TagKey) {
    return buildingKeysToRetain.indexOf(key) !== -1 ||
        /^building:.{1,}/.test(key) ||
        /^roof:.{1,}/.test(key);
}

/**
 * Returns whether extracting from the given entity would _move_ its address tags
 * onto the new node (instead of copying them): This is the case for buildings which
 * are tagged with an address, but have no other (POI) tags. See #12447
 */
export function actionExtractMovesAddressTags(entity: OsmEntity): boolean {
    if (!isBuilding(entity)) return false;

    // apart from building-related tags, the building must look like an address point
    return osmIsAddressPoint(entity.tags, key =>
        isBuildingKey(key) ||
        keysToRetain.indexOf(key) !== -1 ||
        keysToCopyAndRetain.indexOf(key) !== -1 ||
        (entity.type === 'relation' && key === 'type')
    );
}

export function actionExtract(entityID: NodeId, projection: Projection): ActionExtract {

    var extractedNodeID: NodeId;

    const action: ActionExtract = function(graph, _t, shiftKeyPressed) {
        var entity = graph.entity(entityID);

        if (entity.type === 'node') {
            return extractFromNode(entity, graph, shiftKeyPressed);
        }

        return extractFromWayOrRelation(entity, graph);
    };

    function extractFromNode(node: osmNode, graph: coreGraph, shiftKeyPressed: boolean | undefined) {

        extractedNodeID = node.id;

        // Create a new node to replace the one we will detach
        var replacement = new osmNode({ loc: node.loc });
        graph = graph.replace(replacement);

        // Process each way in turn, updating the graph as we go
        graph = graph.parentWays(node)
            .reduce(function(accGraph, parentWay) {
                return accGraph.replace(parentWay.replaceNode(entityID, replacement.id));
            }, graph);

        if (!shiftKeyPressed) return graph;

        // Process any relations too
        // but only if the user holds down the shift key while triggering the operation.
        return graph.parentRelations(node)
            .reduce(function(accGraph, parentRel) {
                return accGraph.replace(parentRel.replaceMember(node, replacement));
            }, graph);
    }

    function extractFromWayOrRelation(entity: OsmEntity, graph: coreGraph) {

        var fromGeometry = entity.geometry(graph);

        var extractedLoc = d3_geoPath(projection).centroid(entity.asGeoJSON(graph));
        extractedLoc = extractedLoc && projection.invert(extractedLoc);
        if (!extractedLoc  || !isFinite(extractedLoc[0]) || !isFinite(extractedLoc[1])) {
            extractedLoc = entity.extent(graph).center();
        }

        var indoorAreaValues: Record<TagValue, boolean> = {
            area: true,
            corridor: true,
            elevator: true,
            level: true,
            room: true
        };

        var isBuildingEntity = isBuilding(entity);
        var isIndoorArea = fromGeometry === 'area' && entity.tags.indoor && indoorAreaValues[entity.tags.indoor];
        var moveAddressTags = actionExtractMovesAddressTags(entity);

        var entityTags = { ...entity.tags };  // shallow copy
        var pointTags: Tags = {};
        for (var key in entityTags) {

            if (entity.type === 'relation' &&
                key === 'type') {
                continue;
            }

            if (keysToRetain.indexOf(key) !== -1) {
                continue;
            }

            if (isBuildingEntity) {
                // don't transfer building-related tags
                if (isBuildingKey(key)) continue;
            }
            // leave `indoor` tag on the area
            if (isIndoorArea && key === 'indoor') {
                continue;
            }

            if (moveAddressTags &&
                !osmIsAddressKey(key) &&
                keysToCopyAndRetain.indexOf(key) === -1) {
                // when moving the address off of an address-only building, leave
                // all remaining tags (e.g. `start_date` or `fixme`) on the building
                continue;
            }

            // copy the tag from the entity to the point
            pointTags[key] = entityTags[key];

            // leave addresses and some other tags so they're on both features
            if (keysToCopyAndRetain.indexOf(key) !== -1 ||
                (osmIsAddressKey(key) && !moveAddressTags)) {
                continue;
            } else if (isIndoorArea && key === 'level') {
                // leave `level` on both features
                continue;
            }

            // remove the tag from the entity
            delete entityTags[key];
        }

        if (!isBuildingEntity && !isIndoorArea && fromGeometry === 'area') {
            // ensure that areas keep area geometry
            entityTags.area = 'yes';
        }

        var replacement = new osmNode({ loc: extractedLoc, tags: pointTags });
        graph = graph.replace(replacement);

        extractedNodeID = replacement.id;

        return graph.replace(entity.update({tags: entityTags}));
    }

    action.getExtractedNodeID = function() {
        return extractedNodeID;
    };

    return action;
}


import { geoCentroid as d3_geoCentroid } from 'd3-geo';
import { osmNode } from '../osm/node';

export function actionExtract(entityID) {

    var extractedNodeID;

    var action = function(graph) {
        var entity = graph.entity(entityID);

        if (entity.type === 'node') {
            return extractFromNode(entity, graph);
        }

        return extractFromWayOrRelation(entity, graph);
    };

    function extractFromNode(node, graph) {

        extractedNodeID = node.id;

        // Create a new node to replace the one we will detach
        var replacement = osmNode({ loc: node.loc });
        graph = graph.replace(replacement);

        // Process each way in turn, updating the graph as we go
        graph = graph.parentWays(node)
            .reduce(function(accGraph, parentWay) {
                return accGraph.replace(parentWay.replaceNode(entityID, replacement.id));
            }, graph);

        // Process any relations too
        return graph.parentRelations(node)
            .reduce(function(accGraph, parentRel) {
                return accGraph.replace(parentRel.replaceMember(node, replacement));
            }, graph);
    }

    function extractFromWayOrRelation(entity, graph) {

        var fromGeometry = entity.geometry(graph);

        var keysToCopyAndRetain = ['source', 'wheelchair'];
        var keysToRetain = ['area'];
        var buildingKeysToRetain = ['architect', 'building', 'height', 'layer'];

        var extractedLoc = d3_geoCentroid(entity.asGeoJSON(graph));
        if (!extractedLoc  || !isFinite(extractedLoc[0]) || !isFinite(extractedLoc[1])) {
            extractedLoc = entity.extent(graph).center();
        }

        var indoorAreaValues = {
            area: true,
            corridor: true,
            elevator: true,
            level: true,
            room: true
        };

        var isBuilding = (entity.tags.building && entity.tags.building !== 'no') ||
            (entity.tags['building:part'] && entity.tags['building:part'] !== 'no');

        var isIndoorArea = fromGeometry === 'area' && entity.tags.indoor && indoorAreaValues[entity.tags.indoor];

        var entityTags = Object.assign({}, entity.tags);  // shallow copy
        var pointTags = {};
        for (var key in entityTags) {

            if (entity.type === 'relation' &&
                key === 'type') {
                continue;
            }

            if (keysToRetain.indexOf(key) !== -1) {
                continue;
            }

            if (isBuilding) {
                // don't transfer building-related tags
                if (buildingKeysToRetain.indexOf(key) !== -1 ||
                    key.match(/^building:.{1,}/) ||
                    key.match(/^roof:.{1,}/)) continue;
            }
            // leave `indoor` tag on the area
            if (isIndoorArea && key === 'indoor') {
                continue;
            }

            // copy the tag from the entity to the point
            pointTags[key] = entityTags[key];

            // leave addresses and some other tags so they're on both features
            if (keysToCopyAndRetain.indexOf(key) !== -1 ||
                key.match(/^addr:.{1,}/)) {
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

        var replacement = osmNode({ loc: extractedLoc, tags: pointTags });
        graph = graph.replace(replacement);

        extractedNodeID = replacement.id;

        return graph.replace(entity.update({tags: entityTags}));
    }

    action.getExtractedNodeID = function() {
        return extractedNodeID;
    };

    return action;
}

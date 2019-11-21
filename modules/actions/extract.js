
import { geoPath as d3_geoPath } from 'd3-geo';
import { osmNode } from '../osm/node';

export function actionExtract(entityID, projection) {

    var extractedNodeID;

    var action = function(graph) {
        var entity = graph.entity(entityID);

        if (entity.type === 'node') {
            return extractFromNode(entity, graph);
        }

        return extractFromArea(entity, graph);
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

    function extractFromArea(entity, graph) {

        var keysToCopyAndRetain = ['source', 'wheelchair'];
        var keysToRetain = ['area', 'type'];
        var buildingKeysToRetain = ['architect', 'building', 'height', 'layer'];

        var centroid = d3_geoPath(projection).centroid(entity.asGeoJSON(graph, true));

        var isBuilding = entity.tags.building;

        var areaTags = Object.assign({}, entity.tags);  // shallow copy
        var pointTags = {};
        for (var key in areaTags) {

            if (keysToRetain.indexOf(key) !== -1) {
                continue;
            }

            if (isBuilding) {
                // don't transfer building-related tags
                if (buildingKeysToRetain.indexOf(key) !== -1 ||
                    key.match(/^building:.{1,}/) ||
                    key.match(/^roof:.{1,}/)) continue;
            }

            // copy the tag from the area to the point
            pointTags[key] = areaTags[key];

            // leave addresses and some other tags so they're on both features
            if (keysToCopyAndRetain.indexOf(key) !== -1 || key.match(/^addr:.{1,}/)) {
                continue;
            }

            // remove the tag from the area
            delete areaTags[key];
        }

        if (!isBuilding) {
            // ensure that the area keeps the area geometry
            areaTags.area = 'yes';
        }

        var replacement = osmNode({ loc: centroid, tags: pointTags });
        graph = graph.replace(replacement);

        extractedNodeID = replacement.id;

        return graph.replace(entity.update({tags: areaTags}));
    }

    action.getExtractedNodeID = function() {
        return extractedNodeID;
    };

    action.disabled = function(graph) {
        var entity = graph.entity(entityID);

        if (entity.type === 'node') {
            var parentRels = graph.parentRelations(entity);
            for (var i = 0; i < parentRels.length; i++) {
                var relation = parentRels[i];
                if (!relation.hasFromViaTo()) continue;

                for (var j = 0; j < relation.members.length; j++) {
                    var m = relation.members[j];
                    if (m.id === entityID && (m.role === 'via' || m.role === 'location_hint')) {
                        return 'restriction';
                    }
                }
            }
        }

        return false;
    };


    return action;
}

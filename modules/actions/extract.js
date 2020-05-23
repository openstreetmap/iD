
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

        var centroid = d3_geoCentroid(entity.asGeoJSON(graph));

        var isBuilding = entity.tags.building && entity.tags.building !== 'no';

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

            // copy the tag from the entity to the point
            pointTags[key] = entityTags[key];

            // leave addresses and some other tags so they're on both features
            if (keysToCopyAndRetain.indexOf(key) !== -1 ||
                key.match(/^addr:.{1,}/)) {
                continue;
            }

            // remove the tag from the entity
            delete entityTags[key];
        }

        if (!isBuilding && fromGeometry === 'area') {
            // ensure that areas keep area geometry
            entityTags.area = 'yes';
        }

        var replacement = osmNode({ loc: centroid, tags: pointTags });
        graph = graph.replace(replacement);

        extractedNodeID = replacement.id;

        return graph.replace(entity.update({tags: entityTags}));
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

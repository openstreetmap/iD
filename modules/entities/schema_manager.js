
import { groupManager } from './group_manager';

function entitySchemaManager() {

    var manager = {};

    manager.canSnapNodeWithTagsToNode = function(nodeTags, node, graph) {

        var parentWays = graph.parentWays(node);

        var vertexGroups = groupManager.groupsWithVertexOf.filter(function(group) {
            return group.matchesTags(nodeTags, 'vertex');
        });

        if (vertexGroups.length === 0) return true;

        for (var j in parentWays) {
            var way = parentWays[j];

            for (var i in vertexGroups) {
                var vertexGroup = vertexGroups[i];
                if (groupManager.group(vertexGroup.vertexOf).matchesTags(way.tags, way.geometry(graph))) {
                    return true;
                }
            }
        }

        return false;
    };

    manager.canAddNodeWithTagsToWay = function(nodeTags, way, graph) {

        var vertexGroups = groupManager.groupsWithVertexOf.filter(function(group) {
            return group.matchesTags(nodeTags, 'vertex');
        });

        if (vertexGroups.length === 0) return true;

        for (var i in vertexGroups) {
            var vertexGroup = vertexGroups[i];
            if (groupManager.group(vertexGroup.vertexOf).matchesTags(way.tags, way.geometry(graph))) {
                return true;
            }
        }

        return false;
    };

    return manager;
}

var schemaManager = entitySchemaManager();

// use a singleton
export { schemaManager };

import _sum from 'lodash-es/sum';
import _extend from 'lodash-es/extend';

import { osmNode } from '../osm/node';


export function actionMergeWayNodes (ids) {
    function getSelectedEntities (graph) {
        return ids.map(function (id) { return graph.entity(id); });
    }

    function calcAverageLoc (nodes) {
        return [
            _sum(nodes.map(function (node) { return node.loc[0]; })) / nodes.length,
            _sum(nodes.map(function (node) { return node.loc[1]; })) / nodes.length
        ];
    }

    function collectTags(entities) {
       return entities.reduce(function(tags, entity) { return _extend(tags, entity.tags); }, {});
    }

    function replaceWithinWays (newNode) {
        return function (graph, node) {
            return graph.parentWays(node).reduce(function (graph, way) {
                return graph.replace(way.replaceNode(node.id, newNode.id));
            }, graph);
        };
    }

    function removeFromGraph (graph, entity) {
        return graph.remove(entity);
    }

    var action = function (graph) {
        var nodes = getSelectedEntities(graph),
            newNode = new osmNode({ loc: calcAverageLoc(nodes), tags: collectTags(nodes) });

        graph = graph.replace(newNode);

        graph = nodes.reduce(replaceWithinWays(newNode), graph);

        graph = nodes.reduce(removeFromGraph, graph);

        return graph;
    };

    action.disabled = function (graph) {
        function isNotWayNode (entity) { return entity.type !== 'node' || graph.parentWays(entity) <= 0; }
        function isNotExtremeNode (node) { return !node.isEndpoint(graph); }

        var entities = getSelectedEntities(graph);

        if (entities.some(isNotWayNode) || entities.some(isNotExtremeNode)) {
            return 'not_eligible';
        }
    };

    return action;
}
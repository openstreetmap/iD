export function actionCopyEntities(ids, fromGraph) {
    var _copies = {};


    var action = function(graph) {
        ids.forEach(function(id) {
            fromGraph.entity(id).copy(fromGraph, _copies);
        });

        for (var id in _copies) {
            graph = graph.replace(_copies[id]);
        }

        return graph;
    };


    action.copies = function() {
        return _copies;
    };


    return action;
}

export function actionCopyEntities(ids, fromGraph) {
    const _copies = {};


    const action = function(graph) {
        ids.forEach(function(id) {
            fromGraph.entity(id).copy(fromGraph, _copies);
        });

        for (const id in _copies) {
            graph = graph.replace(_copies[id]);
        }

        return graph;
    };


    action.copies = function() {
        return _copies;
    };


    return action;
}

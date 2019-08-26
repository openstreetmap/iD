export function actionMoveMember(relationId, fromIndex, toIndex) {
    return function(graph) {
        return graph.replace(graph.entity(relationId).moveMember(fromIndex, toIndex));
    };
}

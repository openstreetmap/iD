export function actionAddEntity(entity) {
    return function(graph) {
        return graph.replace(entity);
    };
}

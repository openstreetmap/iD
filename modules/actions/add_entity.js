export function actionAddEntity(way) {
    return function(graph) {
        return graph.replace(way);
    };
}

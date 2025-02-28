export function actionChangeTags(entityId, tags) {
    return function(graph) {
        const entity = graph.entity(entityId);
        return graph.replace(entity.update({tags: tags}));
    };
}

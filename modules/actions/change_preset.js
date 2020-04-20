export function actionChangePreset(entityID, oldPreset, newPreset, skipFieldDefaults) {
    return function action(graph) {
        var entity = graph.entity(entityID);
        var geometry = entity.geometry(graph);
        var tags = entity.tags;

        if (oldPreset) tags = oldPreset.unsetTags(tags, geometry);
        if (newPreset) tags = newPreset.setTags(tags, geometry, skipFieldDefaults);

        return graph.replace(entity.update({tags: tags}));
    };
}

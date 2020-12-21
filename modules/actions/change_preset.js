export function actionChangePreset(entityID, oldPreset, newPreset, skipFieldDefaults) {
    return function action(graph) {
        var entity = graph.entity(entityID);
        var geometry = entity.geometry(graph);
        var tags = entity.tags;

        // preserve tags that the new preset might care about, if any
        if (oldPreset) tags = oldPreset.unsetTags(tags, geometry, newPreset && newPreset.addTags ? Object.keys(newPreset.addTags) : null);
        if (newPreset) tags = newPreset.setTags(tags, geometry, skipFieldDefaults);

        return graph.replace(entity.update({tags: tags}));
    };
}

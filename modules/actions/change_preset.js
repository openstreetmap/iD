export function actionChangePreset(entityID, oldPreset, newPreset, skipFieldDefaults) {
    return function action(graph) {
        var entity = graph.entity(entityID);
        var geometry = entity.geometry(graph);
        var tags = entity.tags;

        // preserve tags that the new preset might care about, if any
        var preserveKeys;
        if (newPreset) {
            preserveKeys = [];
            if (newPreset.addTags) {
                preserveKeys = preserveKeys.concat(Object.keys(newPreset.addTags));
            }
            if (oldPreset && !oldPreset.id.startsWith(newPreset.id)) {
                // only if old preset is not a sub-preset of the new one:
                // preserve tags for which the new preset has a field
                // https://github.com/openstreetmap/iD/issues/9372
                newPreset.fields().concat(newPreset.moreFields())
                    .filter(f => f.matchGeometry(geometry))
                    .map(f => f.key).filter(Boolean)
                    .forEach(key => preserveKeys.push(key));
            }
        }
        if (oldPreset) tags = oldPreset.unsetTags(tags, geometry, preserveKeys);
        if (newPreset) tags = newPreset.setTags(tags, geometry, skipFieldDefaults);

        return graph.replace(entity.update({tags: tags}));
    };
}

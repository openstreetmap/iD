iD.actions.ChangePreset = function(entityId, oldPreset, newPreset) {
    return function(graph) {
        var entity = graph.entity(entityId),
            geometry = entity.geometry(graph),
            tags = entity.tags;

        if (oldPreset) tags = oldPreset.removeTags(tags, geometry);
        if (newPreset) tags = newPreset.applyTags(tags, geometry);

        return graph.replace(entity.update({tags: tags}));
    };
};

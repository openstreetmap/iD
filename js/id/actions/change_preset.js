iD.actions.ChangePreset = function(entityId, oldPreset, newPreset) {
    return function(graph) {
        var entity = graph.entity(entityId),
            geometry = entity.geometry(graph),
            tags = entity.tags;

        tags = oldPreset.removeTags(tags, geometry);
        tags = newPreset.applyTags(tags, geometry);

        return graph.replace(entity.update({tags: tags}));
    };
};

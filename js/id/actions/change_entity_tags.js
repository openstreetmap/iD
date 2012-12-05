iD.actions.ChangeEntityTags = function(entity, tags) {
    return function(graph) {
        return graph.replace(entity.update({
            tags: tags
        }), 'changed tags');
    };
};

iD.actions.DiscardTags = function(difference) {
    return function(graph) {
        function discardTags(entity) {
            if (!_.isEmpty(entity.tags)) {
                graph = graph.replace(entity.update({
                    tags: _.omit(entity.tags, iD.data.discarded)
                }));
            }
        }

        difference.modified().forEach(discardTags);
        difference.created().forEach(discardTags);

        return graph;
    }
};

iD.actions.DiscardTags = function(entity) {
    return entity.update({
        tags: _.omit(entity.tags, iD.data.discarded)
    });
};

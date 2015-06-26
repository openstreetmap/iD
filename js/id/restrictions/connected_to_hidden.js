iD.restrictions.ConnectedToHidden = function(context) {
    var restriction = {
        id: 'connected_to_hidden',
        lockGeometry: true,
        lockTags: false
    };

    restriction.test = function(ids) {
        var graph = context.graph(),
            entities = _.map(ids, context.entity),
            hasHiddenConnections = function(entity) {
                return context.features().hasHiddenConnections(entity, graph);
            };

        if (_.any(entities, hasHiddenConnections)) {
            return (ids.length === 1 ? t('restrictions.this_is') : t('restrictions.these_are')) +
                ' ' + t('restrictions.connected_to_hidden');
        }
        return false;
    };

    return restriction;
};

iD.restrictions.ConnectedToHidden = function(context) {
    var allow = d3.functor(false),
        restrict = function(ids) {
            var graph = context.graph(),
                entities = _.map(ids, context.entity),
                haveHiddenConnections = function(entity) {
                    return context.features().hasHiddenConnections(entity, graph);
                };

            if (_.any(entities, haveHiddenConnections)) {
                return t('restrictions.connected_to_hidden');
            }
            return false;
        };

    var restriction = {
        id: 'connected_to_hidden',
        lockGeometry: true,
        lockTags: false
// maybe something like this would be better:
        // restrict: {
        //     createGeometry: allow,
        //     updateGeometry: restrict,
        //     deleteGeometry: restrict,
        //     createTag:      allow,
        //     updateTag:      allow,
        //     deleteTag:      allow
        // }
    };

    return restriction;
};

iD.operations.Rotate = function(selectedIDs, context) {
    var entityId = selectedIDs[0];

    var operation = function() {
        context.enter(iD.modes.RotateWay(context, entityId));
    };

    operation.available = function() {
        var graph = context.graph(),
            entity = graph.entity(entityId);

        if (selectedIDs.length !== 1 ||
            entity.type !== 'way')
            return false;
        if (context.geometry(entityId) === 'area')
            return true;
        if (entity.isClosed() &&
            graph.parentRelations(entity).some(function(r) { return r.isMultipolygon(); }))
            return true;
        return false;
    };

    operation.disabled = function() {
        return false;
    };

    operation.tooltip = function() {
        return t('operations.rotate.description');
    };

    operation.id = 'rotate';
    operation.keys = [t('operations.rotate.key')];
    operation.title = t('operations.rotate.title');

    return operation;
};

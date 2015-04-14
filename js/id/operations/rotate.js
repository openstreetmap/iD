iD.operations.Rotate = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        entity = context.entity(entityId),
        extent = entity.extent(context.graph()),
        geometry = context.geometry(entityId);

    var operation = function() {
        context.enter(iD.modes.RotateWay(context, entityId));
    };

    operation.available = function() {
        if (selectedIDs.length !== 1 || entity.type !== 'way')
            return false;
        if (geometry === 'area')
            return true;
        if (entity.isClosed() &&
            context.graph().parentRelations(entity).some(function(r) { return r.isMultipolygon(); }))
            return true;
        return false;
    };

    operation.disabled = function() {
        if (extent.percentContainedIn(context.extent()) < 0.8) {
            return 'too_large';
        } else if (context.hasHiddenConnections(entityId)) {
            return 'connected_to_hidden';
        } else {
            return false;
        }
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.rotate.' + disable) :
            t('operations.rotate.description');
    };

    operation.id = 'rotate';
    operation.keys = [t('operations.rotate.key')];
    operation.title = t('operations.rotate.title');

    return operation;
};

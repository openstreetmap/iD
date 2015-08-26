iD.operations.Move = function(selectedIDs, context) {
    var extent = selectedIDs.reduce(function(extent, id) {
            return extent.extend(context.entity(id).extent(context.graph()));
        }, iD.geo.Extent());

    var operation = function() {
        context.enter(iD.modes.Move(context, selectedIDs));
    };

    operation.available = function() {
        return selectedIDs.length > 1 ||
            context.entity(selectedIDs[0]).type !== 'node';
    };

    operation.disabled = function() {
        var reason = context.geometryLocked(selectedIDs);
        if (reason) return reason;

        reason = action.disabled(context.graph());
        if (reason) return t('operations.move.' + reason);

        if (extent.area() && extent.percentContainedIn(context.extent()) < 0.8) {
            return t('operations.move.too_large');
        }

        return false;
    };

    operation.tooltip = function() {
        return operation.disabled() || t('operations.move.description');
    };

    operation.id = 'move';
    operation.keys = [t('operations.move.key')];
    operation.title = t('operations.move.title');

    return operation;
};

iD.operations.Circularize = function(selectedIDs, context) {
    var entityId = selectedIDs[0],
        geometry = context.geometry(entityId),
        action = iD.actions.Circularize(entityId, context.projection);

    var operation = function() {
        var annotation = t('operations.circularize.annotation.' + geometry);
        context.perform(action, annotation);
    };

    operation.available = function() {
        var entity = context.entity(entityId);
        return selectedIDs.length === 1 &&
            entity.type === 'way' &&
            _.uniq(entity.nodes).length > 1;
    };

    operation.disabled = function() {
        var way = context.entity(entityId),
            wayExtent = way.extent(context.graph()),
            mapExtent = context.extent(),
            intersection = mapExtent.intersection(wayExtent),
            pctVisible = intersection.area() / wayExtent.area();

        if (pctVisible < 0.8) {
            return 'too_large';
        } else {
            return action.disabled(context.graph());
        }
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.circularize.' + disable) :
            t('operations.circularize.description.' + geometry);
    };

    operation.id = 'circularize';
    operation.keys = [t('operations.circularize.key')];
    operation.title = t('operations.circularize.title');

    return operation;
};

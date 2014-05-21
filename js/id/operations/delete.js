iD.operations.Delete = function(selectedIDs, context) {
    var action = iD.actions.DeleteMultiple(selectedIDs);

    var operation = function() {
        var annotation,
            nextSelectedID;

        if (selectedIDs.length > 1) {
            annotation = t('operations.delete.annotation.multiple', {n: selectedIDs.length});

        } else {
            var id = selectedIDs[0],
                entity = context.entity(id),
                geometry = context.geometry(id),
                parents = context.graph().parentWays(entity),
                parent = parents[0];

            annotation = t('operations.delete.annotation.' + geometry);

            // Select the next closest node in the way.
            if (geometry === 'vertex' && parents.length === 1 && parent.nodes.length > 2) {
                var nodes = parent.nodes,
                    i = nodes.indexOf(id);

                if (i === 0) {
                    i++;
                } else if (i === nodes.length - 1) {
                    i--;
                } else {
                    var a = iD.geo.sphericalDistance(entity.loc, context.entity(nodes[i - 1]).loc),
                        b = iD.geo.sphericalDistance(entity.loc, context.entity(nodes[i + 1]).loc);
                    i = a < b ? i - 1 : i + 1;
                }

                nextSelectedID = nodes[i];
            }
        }

        if (nextSelectedID && context.hasEntity(nextSelectedID)) {
            context.enter(iD.modes.Select(context, [nextSelectedID]));
        } else {
            context.enter(iD.modes.Browse(context));
        }

        context.perform(
            action,
            annotation);
    };

    operation.available = function() {
        return true;
    };

    operation.disabled = function() {
        return action.disabled(context.graph());
    };

    operation.tooltip = function() {
        var disable = operation.disabled();
        return disable ?
            t('operations.delete.' + disable) :
            t('operations.delete.description');
    };

    operation.id = 'delete';
    operation.keys = [iD.ui.cmd('⌘⌫'), iD.ui.cmd('⌘⌦')];
    operation.title = t('operations.delete.title');

    return operation;
};

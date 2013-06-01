iD.operations.Delete = function(selection, context) {
    var action = iD.actions.DeleteMultiple(selection);

    var operation = function() {
        var annotation,
            mode;

        if (selection.length > 1) {
            annotation = t('operations.delete.annotation.multiple', {n: selection.length});
            mode = iD.modes.Browse(context);
        } else {
            var id = selection[0],
                entity = context.entity(id),
                geometry = context.geometry(id),
                parents = context.graph().parentWays(entity),
                parent = parents[0];

            annotation = t('operations.delete.annotation.' + geometry);
            mode = iD.modes.Browse(context);

            // Select the next closest node in the way.
            if (geometry === 'vertex' && parents.length === 1 && parent.nodes.length > 2) {
                var nodes = parent.nodes,
                    i = nodes.indexOf(id);

                if (i === 0) {
                    i++;
                } else if (i === nodes.length - 1) {
                    i--;
                } else {
                    var a = iD.geo.dist(entity.loc, context.entity(nodes[i - 1]).loc),
                        b = iD.geo.dist(entity.loc, context.entity(nodes[i + 1]).loc);
                    i = a < b ? i - 1 : i + 1;
                }

                mode = iD.modes.Select(context, [nodes[i]]);
            }
        }

        context.perform(
            action,
            annotation);

        context.enter(mode);

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

    operation.id = "delete";
    operation.keys = [iD.ui.cmd('⌫'), iD.ui.cmd('⌦')];
    operation.title = t('operations.delete.title');

    return operation;
};

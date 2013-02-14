iD.behavior.Select = function(context) {
    var behavior = function(selection) {
        function click() {
            var datum = d3.event.target.__data__;
            if (!(datum instanceof iD.Entity)) {
                if (!d3.event.shiftKey)
                    context.enter(iD.modes.Browse(context));

            } else if (!d3.event.shiftKey) {
                // Avoid re-entering Select mode with same entity.
                if (context.selection().length !== 1 || context.selection()[0] !== datum.id) {
                    context.enter(iD.modes.Select(context, [datum.id]));
                } else {
                    context.mode().reselect();
                }
            } else if (context.selection().indexOf(datum.id) >= 0) {
                var selection = _.without(context.selection(), datum.id);
                context.enter(selection.length ?
                    iD.modes.Select(context, selection) :
                    iD.modes.Browse(context));

            } else {
                context.enter(iD.modes.Select(context, context.selection().concat([datum.id])));
            }
        }

        selection.on('click.select', click);
    };

    behavior.off = function(selection) {
        selection.on('click.select', null);
    };

    return behavior;
};

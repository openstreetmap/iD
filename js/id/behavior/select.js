iD.behavior.Select = function(context) {
    function keydown() {
        if (d3.event && d3.event.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', true);
        }
    }

    function keyup() {
        if (!d3.event || !d3.event.shiftKey) {
            context.surface()
                .classed('behavior-multiselect', false);
        }
    }

    function click() {
        var datum = d3.event.target.__data__;
        var lasso = d3.select('#surface .lasso').node();
        if (!(datum instanceof iD.Entity)) {
            if (!d3.event.shiftKey && !lasso)
                context.enter(iD.modes.Browse(context));

        } else if (!d3.event.shiftKey && !lasso) {
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

    var behavior = function(selection) {
        d3.select(window)
            .on('keydown.select', keydown)
            .on('keyup.select', keyup);

        selection.on('click.select', click);

        keydown();
    };

    behavior.off = function(selection) {
        d3.select(window)
            .on('keydown.select', null)
            .on('keyup.select', null);

        selection.on('click.select', null);

        keyup();
    };

    return behavior;
};

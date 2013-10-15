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
        if (datum && datum.type === 'note') {
            context.enter(iD.modes.Note(context, datum.id));
        } else if (!(datum instanceof iD.Entity)) {
            if (!d3.event.shiftKey && !lasso)
                context.enter(iD.modes.Browse(context));

        } else if (!d3.event.shiftKey && !lasso) {
            // Avoid re-entering Select mode with same entity.
            if (context.selectedIDs().length !== 1 || context.selectedIDs()[0] !== datum.id) {
                context.enter(iD.modes.Select(context, [datum.id]));
            } else {
                context.mode().reselect();
            }
        } else if (context.selectedIDs().indexOf(datum.id) >= 0) {
            var selectedIDs = _.without(context.selectedIDs(), datum.id);
            context.enter(selectedIDs.length ?
                iD.modes.Select(context, selectedIDs) :
                iD.modes.Browse(context));

        } else {
            context.enter(iD.modes.Select(context, context.selectedIDs().concat([datum.id])));
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

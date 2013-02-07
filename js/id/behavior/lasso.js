iD.behavior.Lasso = function(context) {

    var behavior = function(selection) {

        var timeout = null,
            // the position of the first mousedown
            pos = null,
            lasso;

        function mousedown() {
            if (d3.event.shiftKey === true) {

                lasso = iD.ui.lasso().a(d3.mouse(context.surface().node()));

                context.surface().call(lasso);

                selection
                    .on('mousemove.lasso', mousemove)
                    .on('mouseup.lasso', mouseup);

                d3.event.stopPropagation();
                d3.event.preventDefault();

            }
        }

        function mousemove() {
            lasso.b(d3.mouse(context.surface().node()));
        }

        function mouseup() {
            var extent = iD.geo.Extent(
                context.projection.invert(lasso.a()),
                context.projection.invert(lasso.b()));

            lasso.close();

            var selected = context.graph().intersects(extent);

            if (selected.length) {
                context.enter(iD.modes.Select(context, _.pluck(selected, 'id')));
            }

            selection
                .on('mousemove.lasso', null);
        }

        selection
            .on('mousedown.select', mousedown);
    };

    behavior.off = function(selection) {
        selection.on('mousedown.lasso', null);
    };

    return behavior;
};

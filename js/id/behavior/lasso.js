iD.behavior.Lasso = function(context) {

    var behavior = function(selection) {

        var mouse = null,
            lasso;

        function mousedown() {
            if (d3.event.shiftKey === true) {

                mouse = d3.mouse(context.surface().node());
                lasso = null;

                selection
                    .on('mousemove.lasso', mousemove)
                    .on('mouseup.lasso', mouseup);

                d3.event.stopPropagation();
                d3.event.preventDefault();

            }
        }

        function mousemove() {
            if (!lasso) {
                lasso = iD.ui.Lasso().a(mouse);
                context.surface().call(lasso);
            }

            lasso.b(d3.mouse(context.surface().node()));
        }

        function normalize(a, b) {
            return [
                [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
                [Math.max(a[0], b[0]), Math.max(a[1], b[1])]];
        }

        function mouseup() {

            selection
                .on('mousemove.lasso', null)
                .on('mouseup.lasso', null);

            if (!lasso) return;

            var extent = iD.geo.Extent(
                normalize(context.projection.invert(lasso.a()),
                context.projection.invert(lasso.b())));

            lasso.close();

            var selected = context.intersects(extent).filter(function (entity) {
                return entity.type === 'node';
            });

            if (selected.length) {
                context.enter(iD.modes.Select(context, _.pluck(selected, 'id')));
            }
        }

        selection
            .on('mousedown.lasso', mousedown);
    };

    behavior.off = function(selection) {
        selection.on('mousedown.lasso', null);
    };

    return behavior;
};

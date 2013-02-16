iD.behavior.Lasso = function(context) {

    var behavior = function(selection) {

        var timeout = null,
            // the position of the first mousedown
            pos = null,
            lasso;

        function mousedown() {
            if (d3.event.shiftKey === true) {

                pos = [d3.event.clientX, d3.event.clientY];

                lasso = iD.ui.Lasso().a(d3.mouse(context.surface().node()));

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

        function normalize(a, b) {
            return [
                [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
                [Math.max(a[0], b[0]), Math.max(a[1], b[1])]];
        }

        function mouseup() {

            var extent = iD.geo.Extent(
                normalize(context.projection.invert(lasso.a()),
                context.projection.invert(lasso.b())));

            lasso.close();

            selection
                .on('mousemove.lasso', null)
                .on('mouseup.lasso', null);

            if (d3.event.clientX !== pos[0] || d3.event.clientY !== pos[1]) {
                var selected = context.intersects(extent).filter(function (entity) {
                    return entity.type === 'node';
                });

                if (selected.length) {
                    context.enter(iD.modes.Select(context, _.pluck(selected, 'id')));
                }
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

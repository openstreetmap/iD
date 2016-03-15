iD.behavior.Lasso = function(context) {

    var behavior = function(selection) {
        var mouse = null,
            lasso;

        function mousedown() {
            if (d3.event.shiftKey === true) {

                mouse = context.mouse();
                lasso = null;

                selection
                    .on('mousemove.lasso', mousemove)
                    .on('mouseup.lasso', mouseup);

                d3.event.stopPropagation();
            }
        }

        function mousemove() {
            if (!lasso) {
                lasso = iD.ui.Lasso(context).p(mouse);
                context.surface().call(lasso);
            }

            lasso.p(context.mouse());
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

            var graph = context.graph(),
                extent = iD.geo.Extent(
                normalize(context.projection.invert(lasso.getBounds()[0]),
                context.projection.invert(lasso.getBounds()[1])));

            lasso.close();

            var selected = context.intersects(extent).filter(function(entity) {
                return entity.type === 'node' &&
                    iD.geo.pointInPolygon(context.projection(entity.loc), lasso.coordinates) &&
                    !context.features().isHidden(entity, graph, entity.geometry(graph));
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

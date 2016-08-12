import * as d3 from 'd3';
import _ from 'lodash';
import { Extent, pointInPolygon } from '../geo/index';
import { Select } from '../modes/index';
import { Lasso as uiLasso } from '../ui/index';

export function Lasso(context) {

    var behavior = function(selection) {
        var lasso;

        function mousedown() {
            var button = 0;  // left
            if (d3.event.button === button && d3.event.shiftKey === true) {
                lasso = null;

                selection
                    .on('mousemove.lasso', mousemove)
                    .on('mouseup.lasso', mouseup);

                d3.event.stopPropagation();
            }
        }

        function mousemove() {
            if (!lasso) {
                lasso = uiLasso(context);
                context.surface().call(lasso);
            }

            lasso.p(context.mouse());
        }

        function normalize(a, b) {
            return [
                [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
                [Math.max(a[0], b[0]), Math.max(a[1], b[1])]];
        }

        function lassoed() {
            if (!lasso) return [];

            var graph = context.graph(),
                bounds = lasso.extent().map(context.projection.invert),
                extent = Extent(normalize(bounds[0], bounds[1]));

            return _.map(context.intersects(extent).filter(function(entity) {
                return entity.type === 'node' &&
                    pointInPolygon(context.projection(entity.loc), lasso.coordinates) &&
                    !context.features().isHidden(entity, graph, entity.geometry(graph));
            }), 'id');
        }

        function mouseup() {
            selection
                .on('mousemove.lasso', null)
                .on('mouseup.lasso', null);

            if (!lasso) return;

            var ids = lassoed();
            lasso.close();

            if (ids.length) {
                context.enter(Select(context, ids));
            }
        }

        selection
            .on('mousedown.lasso', mousedown);
    };

    behavior.off = function(selection) {
        selection.on('mousedown.lasso', null);
    };

    return behavior;
}

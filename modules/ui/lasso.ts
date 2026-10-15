import { select as d3_select } from 'd3-selection';
import { geoExtent } from '../geo';
import { uiToggle } from './toggle';
import type { Vec2 } from '../geo/vector';

interface Lasso {
    (selection: d3.Selection): void;
    coordinates: Vec2[];
    extent(): geoExtent;
    p: GetSet<Lasso, Vec2>;
    close(): void;
}

export function uiLasso(context: iD.Context) {
    let group: d3.Selection<SVGGElement>;
    let polygon: d3.Selection<SVGPathElement>;

    const lasso: Lasso = function(selection) {
        context.container()
            .classed('lasso', true);

        group = selection
            .append('g')
            .attr('class', 'lasso hide');

        polygon = group
            .append('path')
            .attr('class', 'lasso-path');

        group
            .call(uiToggle(true));
    };

    lasso.coordinates = [];


    function draw() {
        if (polygon) {
            polygon.data([lasso.coordinates])
                .attr('d', function(d) { return 'M' + d.join(' L') + ' Z'; });
        }
    }


    lasso.extent = function () {
        return lasso.coordinates.reduce(function(extent, point) {
            return extent.extend(geoExtent(point));
        }, geoExtent());
    };


    lasso.p = function(_) {
        if (!arguments.length) return lasso;
        lasso.coordinates.push(_);
        draw();
        return lasso;
    } as GetSet<Lasso, Vec2>;


    lasso.close = function() {
        if (group) {
            group.call(uiToggle(false, function() {
                d3_select(this).remove();
            }));
        }
        context.container().classed('lasso', false);
    };


    return lasso;
}

import * as d3 from 'd3';
import { geoRoundCoords } from '../geo/index';
import { uiTooltipHtml } from './tooltipHtml';


export function uiEditMenu(context, operations) {
    var rect,
        menu,
        center = [0, 0],
        offset = [0, 0],
        tooltip;

    var p = 8,  // top padding
        l = 10, // left padding
        h = 15, // height of icon
        m = 4, // top margin 
        a1 = 2 * m + operations.length * (2 * p + h);


    var editMenu = function (selection) {
        if (!operations.length) return;

        selection.node().parentNode.focus();

        function click(operation) {
            d3.event.stopPropagation();
            if (operation.disabled()) return;
            operation();
            editMenu.close();
        }

        menu = selection
            .append('g')
            .attr('class', 'radial-menu')
            .attr('transform', 'translate(' + [center[0] + l, center[1]] + ')')
            .attr('opacity', 0);

        menu
            .transition()
            .attr('opacity', 1);

        rect = menu
            .append('g')
            .attr('class', 'radial-menu-rectangle')
            .attr('transform', function () {
                var pos = [0, 0];
                if (offset[1] <= a1) {
                    pos = [0, offset[1] - a1];
                }
                return 'translate(' + pos + ')';
            });

        rect
            .append('rect')
            .attr('class', 'radial-menu-background')
            .attr('x', 4)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('width', 44)
            .attr('height', a1)
            .attr('stroke-linecap', 'round');


        var button = rect.selectAll()
            .data(operations)
            .enter()
            .append('g')
            .attr('class', function (d) { return 'radial-menu-item radial-menu-item-' + d.id; })
            .classed('disabled', function (d) { return d.disabled(); })
            .attr('transform', function (d, i) {
                return 'translate(' + geoRoundCoords([
                    0,
                    m + i * (2 * p + h)]).join(',') + ')';
            });

        button
            .append('rect')
            // .attr('r', 15)
            .attr('x', 4)
            .attr('width', 44)
            .attr('height', 2 * p + h)
            .on('click', click)
            .on('mousedown', mousedown)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        button
            .append('use')
            .attr('width', '20')
            .attr('height', '20')
            .attr('transform', function () {
                return 'translate(' + [2 * p, 5] + ')';
            })
            .attr('xlink:href', function (d) { return '#operation-' + d.id; });

        tooltip = d3.select(document.body)
            .append('div')
            .attr('class', 'tooltip-inner radial-menu-tooltip');

        function mousedown() {
            d3.event.stopPropagation(); // https://github.com/openstreetmap/iD/issues/1869
        }

        function mouseover(d, i) {
            var width = 260;
            var rect = context.surfaceRect(),
                pos = [
                    offset[0] < width ? center[0] - 255 : center[0],
                    offset[1] <= a1 ? m + center[1] - (a1 - offset[1]) : m + center[1]
                ],
                top = rect.top + i * (2 * p + h) + pos[1],
                left = rect.left + (64) + pos[0];
                var j = i;
                // fix tooltip overflow on y axis
                while (top - center[1] + 90 > offset[1] && j !== 0) {
                    top = rect.top + (--j) * (2 * p + h) + pos[1];
                }
            tooltip
                .style('top', top + 'px')
                .style('left', left+ 'px')
                .style('display', 'block')
                .html(uiTooltipHtml(d.tooltip(), d.keys[0]));
        }

        function mouseout() {
            tooltip.style('display', 'none');
        }
    };


    editMenu.close = function () {
        if (menu) {
            menu
                .style('pointer-events', 'none')
                .transition()
                .attr('opacity', 0)
                .remove();
        }

        if (tooltip) {
            tooltip.remove();
        }
    };


    editMenu.center = function (_) {
        if (!arguments.length) return center;
        center = _;
        return editMenu;
    };

    editMenu.offset = function (_) {
        if (!arguments.length) return offset;
        console.log(offset);
        offset = _;
        return editMenu;
    };

    return editMenu;
}

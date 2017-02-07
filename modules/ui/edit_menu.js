import * as d3 from 'd3';
import { geoRoundCoords } from '../geo/index';
import { uiTooltipHtml } from './tooltipHtml';


export function uiEditMenu(context, operations) {
    var rect,
        menu,
        center = [0, 0],
        offset = 0,
        tooltip;

    var p = 5,
        l = 10, // left padding
        a = 30,
        a1 = (operations.length) * (a + p) + p;

    var editMenu = function(selection) {
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
            .attr('transform', function() {
                var pos = [0, 0];
                if (offset <= a1) {
                    pos = [0, offset - a1];
                }
                return 'translate(' + pos + ')';
            });

        menu
            .append('path')
            .attr('class', 'radial-menu-background')
            .attr('transform', 'translate(1, 1)')
            .attr('d', 'M0 8 L8 14 L8 8 L8 2 Z');

        rect
            .append('rect')
            .attr('class', 'radial-menu-background')
            .attr('x', 8)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('width', 44)
            .attr('height', a1)
            .attr('stroke-linecap', 'round');
        

        var button = rect.selectAll()
            .data(operations)
            .enter()
            .append('g')
            .attr('class', function(d) { return 'radial-menu-item radial-menu-item-' + d.id; })
            .classed('disabled', function(d) { return d.disabled(); })
            .attr('transform', function(d, i) {
                return 'translate(' +geoRoundCoords([
                        a/2 + l + p,
                        a/2 + p * (i + 1) + i * a]).join(',') + ')';
            });

        button
            .append('circle')
            .attr('r', 15)
            .on('click', click)
            .on('mousedown', mousedown)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        button
            .append('use')
            .attr('transform', 'translate(-10,-10)')
            .attr('width', '20')
            .attr('height', '20')
            .attr('xlink:href', function(d) { return '#operation-' + d.id; });

        tooltip = d3.select(document.body)
            .append('div')
            .attr('class', 'tooltip-inner radial-menu-tooltip');

        function mousedown() {
            d3.event.stopPropagation(); // https://github.com/openstreetmap/iD/issues/1869
        }

        function mouseover(d, i) {
            var rect = context.surfaceRect(),
                pos = [center[0], offset <= a1 ? center[1] - (a1 - offset) : center[1]],
                top = rect.top + i * (p + a)+ pos[1] + 'px',
                left = rect.left + (65) + pos[0] + 'px';

            tooltip
                .style('top', top)
                .style('left', left)
                .style('display', 'block')
                .html(uiTooltipHtml(d.tooltip(), d.keys[0]));
        }

        function mouseout() {
            tooltip.style('display', 'none');
        }
    };


    editMenu.close = function() {
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


    editMenu.center = function(_) {
        if (!arguments.length) return center;
        center = _;
        return editMenu;
    };

    editMenu.offset = function(_) {
        if (!arguments.length) return offset;
        offset = _;
        return editMenu;
    };

    return editMenu;
}

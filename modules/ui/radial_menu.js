import * as d3 from 'd3';
import { roundCoords } from '../geo/index';
import { tooltipHtml } from './tooltipHtml';

export function RadialMenu(context, operations) {
    var menu,
        center = [0, 0],
        tooltip;

    var radialMenu = function(selection) {
        if (!operations.length)
            return;

        selection.node().parentNode.focus();

        function click(operation) {
            d3.event.stopPropagation();
            if (operation.disabled())
                return;
            operation();
            radialMenu.close();
        }

        menu = selection.append('g')
            .attr('class', 'radial-menu')
            .attr('transform', 'translate(' + center + ')')
            .attr('opacity', 0);

        menu.transition()
            .attr('opacity', 1);

        var r = 50,
            a = Math.PI / 4,
            a0 = -Math.PI / 4,
            a1 = a0 + (operations.length - 1) * a;

        menu.append('path')
            .attr('class', 'radial-menu-background')
            .attr('d', 'M' + r * Math.sin(a0) + ',' +
                             r * Math.cos(a0) +
                      ' A' + r + ',' + r + ' 0 ' + (operations.length > 5 ? '1' : '0') + ',0 ' +
                             (r * Math.sin(a1) + 1e-3) + ',' +
                             (r * Math.cos(a1) + 1e-3)) // Force positive-length path (#1305)
            .attr('stroke-width', 50)
            .attr('stroke-linecap', 'round');

        var button = menu.selectAll()
            .data(operations)
            .enter()
            .append('g')
            .attr('class', function(d) { return 'radial-menu-item radial-menu-item-' + d.id; })
            .classed('disabled', function(d) { return d.disabled(); })
            .attr('transform', function(d, i) {
                return 'translate(' + roundCoords([
                        r * Math.sin(a0 + i * a),
                        r * Math.cos(a0 + i * a)]).join(',') + ')';
            });

        button.append('circle')
            .attr('r', 15)
            .on('click', click)
            .on('mousedown', mousedown)
            .on('mouseover', mouseover)
            .on('mouseout', mouseout);

        button.append('use')
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
                angle = a0 + i * a,
                top = rect.top + (r + 25) * Math.cos(angle) + center[1] + 'px',
                left = rect.left + (r + 25) * Math.sin(angle) + center[0] + 'px',
                bottom = rect.height - (r + 25) * Math.cos(angle) - center[1] + 'px',
                right = rect.width - (r + 25) * Math.sin(angle) - center[0] + 'px';

            tooltip
                .style('top', null)
                .style('left', null)
                .style('bottom', null)
                .style('right', null)
                .style('display', 'block')
                .html(tooltipHtml(d.tooltip(), d.keys[0]));

            if (i === 0) {
                tooltip
                    .style('right', right)
                    .style('top', top);
            } else if (i >= 4) {
                tooltip
                    .style('left', left)
                    .style('bottom', bottom);
            } else {
                tooltip
                    .style('left', left)
                    .style('top', top);
            }
        }

        function mouseout() {
            tooltip.style('display', 'none');
        }
    };

    radialMenu.close = function() {
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

    radialMenu.center = function(_) {
        if (!arguments.length) return center;
        center = _;
        return radialMenu;
    };

    return radialMenu;
}

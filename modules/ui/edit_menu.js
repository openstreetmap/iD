import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { geoVecFloor } from '../geo';
import { textDirection } from '../util/locale';
import { uiTooltipHtml } from './tooltipHtml';


export function uiEditMenu(context, operations) {
    var menu,
        center = [0, 0],
        offset = [0, 0],
        tooltip;

    var p = 8,               // top padding
        m = 4,               // top margin
        h = 15,              // height of icon
        vpBottomMargin = 45, // viewport bottom margin
        vpSideMargin = 35,   // viewport side margin
        buttonWidth = 44,
        buttonHeight = (2 * p + h),
        menuWidth = buttonWidth,
        menuHeight = (2 * m) + operations.length * buttonHeight,
        menuSideMargin = 10,
        tooltipWidth = 200,
        tooltipHeight = 200;  // a reasonable guess, real height depends on tooltip contents


    var editMenu = function (selection) {
        if (!operations.length) return;

        selection.node().parentNode.focus();

        var isRTL = textDirection === 'rtl',
            viewport = context.surfaceRect();

        if (!isRTL && (center[0] + menuSideMargin + menuWidth) > (viewport.width - vpSideMargin)) {
            // menu is going left-to-right and near right viewport edge, go left instead
            isRTL = true;
        } else if (isRTL && (center[0] - menuSideMargin - menuWidth) < vpSideMargin) {
            // menu is going right-to-left and near left viewport edge, go right instead
            isRTL = false;
        }

        offset[0] = (isRTL ? -1 * (menuSideMargin + menuWidth) : menuSideMargin);

        if (center[1] + menuHeight > (viewport.height - vpBottomMargin)) {
            // menu is near bottom viewport edge, shift upwards
            offset[1] = -1 * (center[1] + menuHeight - viewport.height + vpBottomMargin);
        }

        var origin = [ center[0] + offset[0], center[1] + offset[1] ];

        menu = selection
            .append('g')
            .attr('class', 'edit-menu')
            .attr('transform', 'translate(' + origin + ')')
            .attr('opacity', 0);

        menu
            .transition()
            .attr('opacity', 1);

        menu
            .append('rect')
            .attr('class', 'edit-menu-background')
            .attr('x', 4)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('width', menuWidth)
            .attr('height', menuHeight)
            .attr('stroke-linecap', 'round');


        var button = menu.selectAll('.edit-menu-item')
            .data(operations)
            .enter()
            .append('g')
            .attr('class', function (d) { return 'edit-menu-item edit-menu-item-' + d.id; })
            .classed('disabled', function (d) { return d.disabled(); })
            .attr('transform', function (d, i) {
                return 'translate(' + geoVecFloor([
                    0,
                    m + i * buttonHeight
                ]).join(',') + ')';
            });

        button
            .append('rect')
            .attr('x', 4)
            .attr('width', buttonWidth)
            .attr('height', buttonHeight)
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

        tooltip = d3_select(document.body)
            .append('div')
            .attr('class', 'tooltip-inner edit-menu-tooltip');


        function click(operation) {
            d3_event.stopPropagation();
            if (operation.disabled()) return;
            operation();
            editMenu.close();
        }

        function mousedown() {
            d3_event.stopPropagation();  // https://github.com/openstreetmap/iD/issues/1869
        }

        function mouseover(d, i) {
            var tipX, tipY;

            if (!isRTL) {
                tipX = viewport.left + origin[0] + menuSideMargin + menuWidth;
            } else {
                tipX = viewport.left + origin[0] - 4 - tooltipWidth;
            }

            if (tipX + tooltipWidth > viewport.right) {
                // tip is going left-to-right and near right viewport edge, go left instead
                tipX = viewport.left + origin[0] - 4 - tooltipWidth;
            } else if (tipX < viewport.left) {
                // tip is going right-to-left and near left viewport edge, go right instead
                tipX = viewport.left + origin[0] + menuSideMargin + menuWidth;
            }

            tipY = viewport.top + origin[1] + (i * buttonHeight);
            if (tipY + tooltipHeight > viewport.bottom) {
                // tip is near bottom viewport edge, shift upwards
                tipY -= tipY + tooltipHeight - viewport.bottom;
            }

            tooltip
                .style('left', tipX + 'px')
                .style('top', tipY + 'px')
                .style('display', 'block')
                .html(uiTooltipHtml(d.tooltip(), d.keys[0], d.title));
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


    return editMenu;
}

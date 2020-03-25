import { event as d3_event, select as d3_select } from 'd3-selection';

import { geoVecAdd } from '../geo';
import { textDirection } from '../util/locale';
import { uiTooltip } from './tooltip';
import { svgIcon } from '../svg/icon';


export function uiEditMenu(context, operations) {
    var menu;
    var center = [0, 0];
    var offset = [0, 0];

    var vpBottomMargin = 45; // viewport bottom margin
    var vpSideMargin = 35;   // viewport side margin

    // hardcode these values to make menu positioning easier
    var buttonWidth = 44;
    var buttonHeight = 34;
    var menuWidth = buttonWidth;
    var verticalPadding = 4;

    // offset the menu slightly from the target location
    var menuSideMargin = 10;


    var editMenu = function (selection) {
        if (!operations.length) return;

        selection.node().parentNode.focus();

        var isRTL = textDirection === 'rtl';
        var viewport = context.surfaceRect();

        var menuHeight = verticalPadding * 2 + operations.length * buttonHeight;

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

        var origin = geoVecAdd(center, offset);

        menu = selection
            .append('div')
            .attr('class', 'edit-menu')
            .style('padding', verticalPadding + 'px 0')
            .style('left', origin[0] + 'px')
            .style('top', origin[1] + 'px')
            .attr('opacity', 0);

        menu
            .transition()
            .attr('opacity', 1);

        var buttons = menu.selectAll('.edit-menu-item')
            .data(operations);

        // enter
        var buttonsEnter = buttons.enter()
            .append('button')
            .attr('class', function (d) { return 'edit-menu-item edit-menu-item-' + d.id; })
            .style('width', buttonWidth + 'px')
            .style('height', buttonHeight + 'px')
            .on('click', click)
            .on('mousedown', mousedown);

        buttonsEnter.each(function(d) {
            d3_select(this)
                .call(svgIcon('#iD-operation-' + d.id, 'operation-icon'))
                .call(uiTooltip()
                    .heading(d.title)
                    .title(d.tooltip())
                    .keys([d.keys[0]])
                    .placement('right')
                );
        });

        // update
        buttons = buttonsEnter
            .merge(buttons)
            .classed('disabled', function(d) { return d.disabled(); });


        function click(operation) {
            d3_event.stopPropagation();
            if (operation.disabled()) return;
            operation();
            editMenu.close();
        }

        function mousedown() {
            d3_event.stopPropagation();  // https://github.com/openstreetmap/iD/issues/1869
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
    };


    editMenu.center = function(val) {
        if (!arguments.length) return center;
        center = val;
        return editMenu;
    };


    return editMenu;
}

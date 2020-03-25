import { event as d3_event, select as d3_select } from 'd3-selection';

import { geoVecAdd } from '../geo';
import { textDirection } from '../util/locale';
import { uiTooltip } from './tooltip';
import { svgIcon } from '../svg/icon';


export function uiEditMenu(context, operations) {
    var _menu = d3_select(null);
    var _center = [0, 0];

    var _vpBottomMargin = 45; // viewport bottom margin
    var _vpSideMargin = 35;   // viewport side margin

    // hardcode these values to make menu positioning easier
    var _buttonWidth = 44;
    var _buttonHeight = 34;
    var _menuWidth = _buttonWidth;
    var _verticalPadding = 4;

    // offset the menu slightly from the target location
    var _menuSideMargin = 10;

    var editMenu = function (selection) {
        if (!operations.length) return;

        selection.node().parentNode.focus();

        var isRTL = textDirection === 'rtl';
        var viewport = context.surfaceRect();

        var menuHeight = _verticalPadding * 2 + operations.length * _buttonHeight;

        if (!isRTL && (_center[0] + _menuSideMargin + _menuWidth) > (viewport.width - _vpSideMargin)) {
            // menu is going left-to-right and near right viewport edge, go left instead
            isRTL = true;
        } else if (isRTL && (_center[0] - _menuSideMargin - _menuWidth) < _vpSideMargin) {
            // menu is going right-to-left and near left viewport edge, go right instead
            isRTL = false;
        }

        var offset = [0, 0];

        offset[0] = (isRTL ? -1 * (_menuSideMargin + _menuWidth) : _menuSideMargin);

        if (_center[1] + menuHeight > (viewport.height - _vpBottomMargin)) {
            // menu is near bottom viewport edge, shift upwards
            offset[1] = -1 * (_center[1] + menuHeight - viewport.height + _vpBottomMargin);
        }

        var origin = geoVecAdd(_center, offset);

        _menu = selection
            .append('div')
            .attr('class', 'edit-menu')
            .style('padding', _verticalPadding + 'px 0')
            .style('left', origin[0] + 'px')
            .style('top', origin[1] + 'px');

        var buttons = _menu.selectAll('.edit-menu-item')
            .data(operations);

        // enter
        var buttonsEnter = buttons.enter()
            .append('button')
            .attr('class', function (d) { return 'edit-menu-item edit-menu-item-' + d.id; })
            .style('width', _buttonWidth + 'px')
            .style('height', _buttonHeight + 'px')
            .on('click', click)
            .on('pointerdown mousedown', pointerdown);

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

        function pointerdown() {
            d3_event.stopPropagation();  // https://github.com/openstreetmap/iD/issues/1869
        }
    };

    editMenu.close = function () {
        _menu
            .remove();
    };

    editMenu.center = function(val) {
        if (!arguments.length) return _center;
        _center = val;
        return editMenu;
    };

    return editMenu;
}

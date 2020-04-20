import { event as d3_event, select as d3_select } from 'd3-selection';

import { geoVecAdd } from '../geo';
import { localizer } from '../core/localizer';
import { uiTooltip } from './tooltip';
import { svgIcon } from '../svg/icon';


export function uiEditMenu(context) {
    var _menu = d3_select(null);
    var _operations = [];
    // the position the menu should be displayed relative to
    var _anchorLoc = [0, 0];

    var _vpBottomMargin = 45; // viewport bottom margin
    var _vpSideMargin = 35;   // viewport side margin

    // hardcode these values to make menu positioning easier
    var _buttonWidth = 44;
    var _buttonHeight = 34;
    var _menuWidth = _buttonWidth;
    var _verticalPadding = 4;

    // see also `.edit-menu .tooltip` CSS; include margin
    var _tooltipWidth = 210;

    // offset the menu slightly from the target location
    var _menuSideMargin = 10;

    var editMenu = function(selection) {
        if (!_operations.length) return;

        var offset = [0, 0];
        var viewport = context.surfaceRect();

        var menuLeft = displayOnLeft(viewport);

        offset[0] = menuLeft ? -1 * (_menuSideMargin + _menuWidth) : _menuSideMargin;

        var menuHeight = _verticalPadding * 2 + _operations.length * _buttonHeight;

        if (_anchorLoc[1] + menuHeight > (viewport.height - _vpBottomMargin)) {
            // menu is near bottom viewport edge, shift upwards
            offset[1] = -1 * (_anchorLoc[1] + menuHeight - viewport.height + _vpBottomMargin);
        }

        var origin = geoVecAdd(_anchorLoc, offset);

        _menu = selection
            .append('div')
            .attr('class', 'edit-menu')
            .style('padding', _verticalPadding + 'px 0')
            .style('left', origin[0] + 'px')
            .style('top', origin[1] + 'px');

        var buttons = _menu.selectAll('.edit-menu-item')
            .data(_operations);

        // enter
        var buttonsEnter = buttons.enter()
            .append('button')
            .attr('class', function (d) { return 'edit-menu-item edit-menu-item-' + d.id; })
            .style('width', _buttonWidth + 'px')
            .style('height', _buttonHeight + 'px')
            .on('click', click)
            .on('pointerdown mousedown', pointerdown);

        var tooltipSide = tooltipPosition(viewport, menuLeft);

        buttonsEnter.each(function(d) {
            d3_select(this)
                .call(svgIcon('#iD-operation-' + d.id, 'operation-icon'))
                .call(uiTooltip()
                    .heading(d.title)
                    .title(d.tooltip())
                    .keys([d.keys[0]])
                    .placement(tooltipSide)
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

    function displayOnLeft(viewport) {
        if (localizer.textDirection() === 'ltr') {
            if ((_anchorLoc[0] + _menuSideMargin + _menuWidth) > (viewport.width - _vpSideMargin)) {
                // right menu would be too close to the right viewport edge, go left
                return true;
            }
            // prefer right menu
            return false;

        } else { // rtl
            if ((_anchorLoc[0] - _menuSideMargin - _menuWidth) < _vpSideMargin) {
                // left menu would be too close to the left viewport edge, go right
                return false;
            }
            // prefer left menu
            return true;
        }
    }

    function tooltipPosition(viewport, menuLeft) {
        if (localizer.textDirection() === 'ltr') {
            if (menuLeft) {
                // if there's not room for a right-side menu then there definitely
                // isn't room for right-side tooltips
                return 'left';
            }
            if ((_anchorLoc[0] + _menuSideMargin + _menuWidth + _tooltipWidth) > (viewport.width - _vpSideMargin)) {
                // right tooltips would be too close to the right viewport edge, go left
                return 'left';
            }
            // prefer right tooltips
            return 'right';

        } else { // rtl
            if (!menuLeft) {
                return 'right';
            }
            if ((_anchorLoc[0] - _menuSideMargin - _menuWidth - _tooltipWidth) < _vpSideMargin) {
                // left tooltips would be too close to the left viewport edge, go right
                return 'right';
            }
            // prefer left tooltips
            return 'left';
        }
    }

    editMenu.close = function () {
        _menu
            .remove();
    };

    editMenu.anchorLoc = function(val) {
        if (!arguments.length) return _anchorLoc;
        _anchorLoc = val;
        return editMenu;
    };

    editMenu.operations = function(val) {
        if (!arguments.length) return _operations;
        _operations = val;
        return editMenu;
    };

    return editMenu;
}

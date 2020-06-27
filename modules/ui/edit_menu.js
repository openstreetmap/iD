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
    // a string indicating how the menu was opened
    var _triggerType = '';

    var _vpTopMargin = 85; // viewport top margin
    var _vpBottomMargin = 45; // viewport bottom margin
    var _vpSideMargin = 35;   // viewport side margin

    // hardcode these values to make menu positioning easier
    var _verticalPadding = 4;

    // see also `.edit-menu .tooltip` CSS; include margin
    var _tooltipWidth = 210;

    // offset the menu slightly from the target location
    var _menuSideMargin = 10;

    var editMenu = function(selection) {

        var isTouchMenu = _triggerType.includes('touch') || _triggerType.includes('pen');

        var ops = _operations.filter(function(op) {
            return !isTouchMenu || !op.mouseOnly;
        });

        if (!ops.length) return;

        var offset = [0, 0];
        var viewport = context.surfaceRect();

        // Position the menu above the anchor for stylus and finger input
        // since the mapper's hand likely obscures the screen below the anchor
        var menuTop = isTouchMenu;

        // Show labels for touch input since there aren't hover tooltips
        var showLabels = isTouchMenu;

        var buttonHeight = showLabels ? 32 : 34;
        var menuWidth;
        if (showLabels) {
            // Get a general idea of the width based on the length of the label
            menuWidth = 52 + Math.min(120, 6 * Math.max.apply(Math, ops.map(function(op) {
                return op.title.length;
            })));
        } else {
            menuWidth = 44;
        }

        var menuLeft = displayOnLeft(viewport);

        offset[0] = menuLeft ? -1 * (_menuSideMargin + menuWidth) : _menuSideMargin;

        var menuHeight = _verticalPadding * 2 + ops.length * buttonHeight;


        if (menuTop) {
            if (_anchorLoc[1] - menuHeight < _vpTopMargin) {
                // menu is near top viewport edge, shift downward
                offset[1] = -_anchorLoc[1] + _vpTopMargin;
            } else {
                offset[1] = -menuHeight;
            }
        } else {
            if (_anchorLoc[1] + menuHeight > (viewport.height - _vpBottomMargin)) {
                // menu is near bottom viewport edge, shift upwards
                offset[1] = -_anchorLoc[1] - menuHeight + viewport.height - _vpBottomMargin;
            } else {
                offset[1] = 0;
            }
        }

        var origin = geoVecAdd(_anchorLoc, offset);

        _menu = selection
            .append('div')
            .attr('class', 'edit-menu')
            .classed('touch-menu', isTouchMenu)
            .style('padding', _verticalPadding + 'px 0')
            .style('left', origin[0] + 'px')
            .style('top', origin[1] + 'px');

        var buttons = _menu.selectAll('.edit-menu-item')
            .data(ops);

        // enter
        var buttonsEnter = buttons.enter()
            .append('button')
            .attr('class', function (d) { return 'edit-menu-item edit-menu-item-' + d.id; })
            .style('height', buttonHeight + 'px')
            .on('click', click)
            // don't listen for `mouseup` because we only care about non-mouse pointer types
            .on('pointerup', pointerup)
            .on('pointerdown mousedown', function pointerdown() {
                // don't let button presses also act as map input - #1869
                d3_event.stopPropagation();
            });

        var tooltipSide = tooltipPosition(viewport, menuLeft);

        buttonsEnter.each(function(d) {
            d3_select(this)
                .call(uiTooltip()
                    .heading(d.title)
                    .title(d.tooltip())
                    .keys([d.keys[0]])
                    .placement(tooltipSide)
                )
                .append('div')
                .attr('class', 'icon-wrap')
                .call(svgIcon('#iD-operation-' + d.id, 'operation-icon'));
        });

        if (showLabels) {
            buttonsEnter.append('span')
                .attr('class', 'label')
                .text(function(d) {
                    return d.title;
                });
        }

        // update
        buttons = buttonsEnter
            .merge(buttons)
            .classed('disabled', function(d) { return d.disabled(); });


        var lastPointerUpType;
        // `pointerup` is always called before `click`
        function pointerup() {
            lastPointerUpType = d3_event.pointerType;
        }

        function click(operation) {
            d3_event.stopPropagation();
            if (operation.disabled()) {
                if (lastPointerUpType === 'touch' ||
                    lastPointerUpType === 'pen') {
                    // there are no tooltips for touch interactions so flash feedback instead
                    context.ui().flash
                        .duration(4000)
                        .iconName('#iD-operation-' + operation.id)
                        .iconClass('operation disabled')
                        .text(operation.tooltip)();
                }
            } else {
                if (lastPointerUpType === 'touch' ||
                    lastPointerUpType === 'pen') {
                    context.ui().flash
                        .duration(2000)
                        .iconName('#iD-operation-' + operation.id)
                        .iconClass('operation')
                        .text(operation.annotation() || operation.title)();
                }

                operation();
                editMenu.close();
            }
            lastPointerUpType = null;
        }

        function displayOnLeft(viewport) {
            if (localizer.textDirection() === 'ltr') {
                if ((_anchorLoc[0] + _menuSideMargin + menuWidth) > (viewport.width - _vpSideMargin)) {
                    // right menu would be too close to the right viewport edge, go left
                    return true;
                }
                // prefer right menu
                return false;

            } else { // rtl
                if ((_anchorLoc[0] - _menuSideMargin - menuWidth) < _vpSideMargin) {
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
                if ((_anchorLoc[0] + _menuSideMargin + menuWidth + _tooltipWidth) > (viewport.width - _vpSideMargin)) {
                    // right tooltips would be too close to the right viewport edge, go left
                    return 'left';
                }
                // prefer right tooltips
                return 'right';

            } else { // rtl
                if (!menuLeft) {
                    return 'right';
                }
                if ((_anchorLoc[0] - _menuSideMargin - menuWidth - _tooltipWidth) < _vpSideMargin) {
                    // left tooltips would be too close to the left viewport edge, go right
                    return 'right';
                }
                // prefer left tooltips
                return 'left';
            }
        }
    };

    editMenu.close = function () {
        _menu
            .remove();
    };

    editMenu.anchorLoc = function(val) {
        if (!arguments.length) return _anchorLoc;
        _anchorLoc = val;
        return editMenu;
    };

    editMenu.triggerType = function(val) {
        if (!arguments.length) return _triggerType;
        _triggerType = val;
        return editMenu;
    };

    editMenu.operations = function(val) {
        if (!arguments.length) return _operations;
        _operations = val;
        return editMenu;
    };

    return editMenu;
}

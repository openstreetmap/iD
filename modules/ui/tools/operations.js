import { select as d3_select } from 'd3-selection';

import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';
import { uiTooltip } from '../tooltip';


function isMobileViewport() {
    return typeof window.matchMedia === 'function' ?
        window.matchMedia('(max-width: 767px)').matches :
        window.innerWidth <= 767;
}


function isTouchPointer(context) {
    var pointer = typeof context.lastPointerType === 'function' ?
        context.lastPointerType() :
        context.container().attr('pointer');
    return pointer === 'touch' || pointer === 'pen';
}


/**
 * A toolbar button which opens the edit menu (i.e. the "right click menu") for the
 * current selection. On touch devices the edit menu can otherwise only be reached by
 * long-pressing a feature, which is hard to discover and hard to perform precisely,
 * e.g. on a vertex. The button is only shown for touch/pen input or on small screens.
 */
export function uiToolOperations(context) {
    var tool = {
        id: 'operations',
        label: t.append('toolbar.operations.title')
    };

    var _button = d3_select(null);
    var _toolbarItem = d3_select(null);
    var _lastPointerUpType = null;
    var _menuOpen = false;

    function operations() {
        var mode = context.mode();
        if (!mode || mode.id !== 'select' || !mode.operations) return [];
        var isTouch = isTouchPointer(context);
        return mode.operations().filter(function(operation) {
            // `mouseOnly` operations (like move) are not shown in the touch menu either
            return !isTouch || !operation.mouseOnly;
        });
    }

    function showButton() {
        return (isMobileViewport() || isTouchPointer(context)) &&
            context.map().withinEditableZoom() &&
            operations().length > 0;
    }

    // the edit menu is positioned relative to a point on the map: use the center
    // of the selection if it is visible, otherwise the center of the map
    function anchorPoint() {
        var viewport = context.surfaceRect();
        var point = [viewport.width / 2, viewport.height / 2];
        var graph = context.graph();
        var extent = context.selectedIDs().reduce(function(extent, id) {
            var entity = graph.hasEntity(id);
            if (!entity) return extent;
            return extent ? extent.extend(entity.extent(graph)) : entity.extent(graph);
        }, null);
        if (extent) {
            var center = context.projection(extent.center());
            if (center[0] > 0 && center[0] < viewport.width &&
                center[1] > 0 && center[1] < viewport.height) {
                point = center;
            }
        }
        return point;
    }

    function pointerup(d3_event) {
        _lastPointerUpType = d3_event.pointerType;
    }

    function click(d3_event) {
        d3_event.preventDefault();
        d3_event.stopPropagation();

        if (_menuOpen) {
            context.ui().closeEditMenu();
            return;
        }

        var pointerType = _lastPointerUpType || (isTouchPointer(context) ? 'touch' : 'mouse');
        _lastPointerUpType = null;

        context.ui().showEditMenu(anchorPoint(), 'toolbar-' + pointerType, operations());
    }

    function update() {
        var show = showButton();
        _toolbarItem.classed('hide', !show);

        var buttons = _button.selectAll('button')
            .data(show ? [0] : []);

        buttons.exit()
            .remove();

        var buttonsEnter = buttons.enter()
            .append('button')
            .attr('type', 'button')
            .attr('class', 'operations-button bar-button')
            .attr('aria-haspopup', 'menu')
            .on('pointerup', pointerup)
            .on('click', click)
            .call(uiTooltip()
                .placement('bottom')
                .title(() => t.append('toolbar.operations.tooltip'))
            );

        buttonsEnter
            .call(svgIcon('#iD-icon-edit'));

        buttons = buttonsEnter.merge(buttons);

        buttons
            .classed('active', _menuOpen)
            .attr('aria-expanded', _menuOpen ? 'true' : 'false')
            .attr('aria-label', t('toolbar.operations.title'));

        if (context.ui && context.ui().checkOverflow) {
            context.ui().checkOverflow('.top-toolbar', true);
        }
    }

    tool.render = function(selection) {
        _button = selection;
        _toolbarItem = d3_select(selection.node().parentNode);

        update();

        context
            .on('enter.operations', update);
        context.history()
            .on('change.operations', update);
        context.map()
            .on('move.operations', update);
        if (context.ui && context.ui().editMenu) {
            context.ui().editMenu()
                .on('toggled.operations', function(open) {
                    _menuOpen = open;
                    update();
                });
        }
    };

    tool.uninstall = function() {
        context
            .on('enter.operations', null);
        context.history()
            .on('change.operations', null);
        context.map()
            .on('move.operations', null);
        if (context.ui && context.ui().editMenu) {
            context.ui().editMenu()
                .on('toggled.operations', null);
        }

        _button = d3_select(null);
        _toolbarItem = d3_select(null);
        _lastPointerUpType = null;
        _menuOpen = false;
    };

    return tool;
}

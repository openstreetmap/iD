import { select as d3_select } from 'd3-selection';

import { t } from '../../core/localizer';
import { svgIcon } from '../../svg';


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


export function uiToolSplit(context) {
    var tool = {
        id: 'split',
        label: t.append('operations.split.title')
    };

    var _button = d3_select(null);
    var _toolbarItem = d3_select(null);
    var _operation = null;
    var _lastPointerUpType = null;

    function currentOperation() {
        var mode = context.mode();
        if (!mode || mode.id !== 'select' || !mode.operations) return null;
        return mode.operations().find(function(operation) {
            return operation.id === 'split';
        }) || null;
    }

    function showButton() {
        return (isMobileViewport() || isTouchPointer(context)) &&
            context.map().withinEditableZoom() &&
            _operation &&
            _operation.available();
    }

    function disabledReason() {
        return _operation && _operation.disabled && _operation.disabled();
    }

    function operationIcon() {
        return _operation && _operation.icon ? _operation.icon() : '#iD-operation-split';
    }

    function pointerup(d3_event) {
        _lastPointerUpType = d3_event.pointerType;
    }

    function click(d3_event) {
        d3_event.preventDefault();

        if (!_operation) return;

        var operation = _operation;
        var icon = operationIcon();
        var title = operation.title;
        var tooltip = operation.tooltip ? operation.tooltip() : t('operations.split.title');
        var annotation = operation.annotation ? operation.annotation() : null;
        var pointerType = _lastPointerUpType;
        _lastPointerUpType = null;

        var disabled = disabledReason();
        if (disabled) {
            var interrupt = operation.interrupts && operation.interrupts[disabled];
            if (interrupt) {
                interrupt();
                return;
            }

            if (context.ui && context.ui().flash) {
                context.ui().flash
                    .duration(4000)
                    .iconName(icon)
                    .iconClass('operation disabled')
                    .label(tooltip)();
            }
            return;
        }

        operation();

        if (context.ui && context.ui().flash && (
            pointerType === 'touch' ||
            pointerType === 'pen'
        )) {
            context.ui().flash
                .duration(2000)
                .iconName(icon)
                .iconClass('operation')
                .label(annotation || title)();
        }
    }

    function update() {
        _operation = currentOperation();

        var show = showButton();
        _toolbarItem.classed('hide', !show);

        var buttons = _button.selectAll('button')
            .data(show ? [_operation] : []);

        buttons.exit()
            .remove();

        var buttonsEnter = buttons.enter()
            .append('button')
            .attr('type', 'button')
            .attr('class', 'split-button bar-button')
            .on('pointerup', pointerup)
            .on('click', click);

        buttons = buttonsEnter.merge(buttons);

        var disabled = disabledReason();
        var interrupt = disabled && _operation.interrupts && _operation.interrupts[disabled];

        buttons
            .each(function() {
                d3_select(this)
                    .call(svgIcon(operationIcon()));
            })
            .classed('disabled', !!disabled && !interrupt)
            .attr('aria-disabled', !!disabled && !interrupt ? 'true' : null)
            .attr('aria-label', t('operations.split.title'))
            .attr('title', _operation ? _operation.tooltip() : t('operations.split.title'));

        if (context.ui && context.ui().checkOverflow) {
            context.ui().checkOverflow('.top-toolbar', true);
        }
    }

    tool.render = function(selection) {
        _button = selection;
        _toolbarItem = d3_select(selection.node().parentNode);

        update();

        context
            .on('enter.split', update);
        context.history()
            .on('change.split', update);
    };

    tool.uninstall = function() {
        context
            .on('enter.split', null);
        context.history()
            .on('change.split', null);

        _button = d3_select(null);
        _toolbarItem = d3_select(null);
        _operation = null;
        _lastPointerUpType = null;
    };

    return tool;
}

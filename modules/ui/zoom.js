import {
    select as d3_select
} from 'd3-selection';

import { t, localizer } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiCmd } from './cmd';
import { uiTooltip } from './tooltip';
import { utilKeybinding } from '../util/keybinding';


export function uiZoom(context) {

    var zooms = [{
        id: 'zoom-in',
        icon: 'iD-icon-plus',
        title: t.append('zoom.in'),
        action: zoomIn,
        disabled: function() {
            return !context.map().canZoomIn();
        },
        disabledTitle: t.append('zoom.disabled.in'),
        key: '+'
    }, {
        id: 'zoom-out',
        icon: 'iD-icon-minus',
        title: t.append('zoom.out'),
        action: zoomOut,
        disabled: function() {
            return !context.map().canZoomOut();
        },
        disabledTitle: t.append('zoom.disabled.out'),
        key: '-'
    }];

    function zoomIn(d3_event) {
        if (d3_event.shiftKey) return;
        d3_event.preventDefault();
        context.map().zoomIn();
    }

    function zoomOut(d3_event) {
        if (d3_event.shiftKey) return;
        d3_event.preventDefault();
        context.map().zoomOut();
    }

    function zoomInFurther(d3_event) {
        if (d3_event.shiftKey) return;
        d3_event.preventDefault();
        context.map().zoomInFurther();
    }

    function zoomOutFurther(d3_event) {
        if (d3_event.shiftKey) return;
        d3_event.preventDefault();
        context.map().zoomOutFurther();
    }

    return function(selection) {
        var tooltipBehavior = uiTooltip()
            .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            .title(function(d) {
                if (d.disabled()) {
                    return d.disabledTitle;
                }
                return d.title;
            })
            .keys(function(d) {
                return [d.key];
            });

        var lastPointerUpType;

        var buttons = selection.selectAll('button')
            .data(zooms)
            .enter()
            .append('button')
            .attr('class', function(d) { return d.id; })
            .on('pointerup.editor', function(d3_event) {
                lastPointerUpType = d3_event.pointerType;
            })
            .on('click.editor', function(d3_event, d) {
                if (!d.disabled()) {
                    d.action(d3_event);
                } else if (lastPointerUpType === 'touch' || lastPointerUpType === 'pen') {
                    context.ui().flash
                        .duration(2000)
                        .iconName('#' + d.icon)
                        .iconClass('disabled')
                        .label(d.disabledTitle)();
                }
                lastPointerUpType = null;
            })
            .call(tooltipBehavior);

        buttons.each(function(d) {
            d3_select(this)
                .call(svgIcon('#' + d.icon, 'light'));
        });

        utilKeybinding.plusKeys.forEach(function(key) {
            context.keybinding().on([key], zoomIn);
            context.keybinding().on([uiCmd('⌥' + key)], zoomInFurther);
        });

        utilKeybinding.minusKeys.forEach(function(key) {
            context.keybinding().on([key], zoomOut);
            context.keybinding().on([uiCmd('⌥' + key)], zoomOutFurther);
        });

        function updateButtonStates() {
            buttons
                .classed('disabled', function(d) {
                    return d.disabled();
                })
                .each(function() {
                    var selection = d3_select(this);
                    if (!selection.select('.tooltip.in').empty()) {
                        selection.call(tooltipBehavior.updateContent);
                    }
                });
        }

        updateButtonStates();

        context.map().on('move.uiZoom', updateButtonStates);
    };
}

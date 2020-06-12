import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t, localizer } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiCmd } from './cmd';
import { uiTooltip } from './tooltip';


export function uiZoom(context) {

    var zooms = [{
        id: 'zoom-in',
        icon: 'iD-icon-plus',
        title: t('zoom.in'),
        action: zoomIn,
        disabled: function() {
            return !context.map().canZoomIn();
        },
        disabledTitle: t('zoom.disabled.in'),
        key: '+'
    }, {
        id: 'zoom-out',
        icon: 'iD-icon-minus',
        title: t('zoom.out'),
        action: zoomOut,
        disabled: function() {
            return !context.map().canZoomOut();
        },
        disabledTitle: t('zoom.disabled.out'),
        key: '-'
    }];

    function zoomIn() {
        d3_event.preventDefault();
        context.map().zoomIn();
    }

    function zoomOut() {
        d3_event.preventDefault();
        context.map().zoomOut();
    }

    function zoomInFurther() {
        d3_event.preventDefault();
        context.map().zoomInFurther();
    }

    function zoomOutFurther() {
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
            .on('pointerup.editor', function() {
                lastPointerUpType = d3_event.pointerType;
            })
            .on('click.editor', function(d) {
                if (!d.disabled()) {
                    d.action();
                } else if (lastPointerUpType === 'touch' || lastPointerUpType === 'pen') {
                    context.ui().flash
                        .duration(2000)
                        .iconName('#' + d.icon)
                        .iconClass('disabled')
                        .text(d.disabledTitle)();
                }
                lastPointerUpType = null;
            })
            .call(tooltipBehavior);

        buttons.each(function(d) {
            d3_select(this)
                .call(svgIcon('#' + d.icon, 'light'));
        });

        ['plus', 'ffplus', '=', 'ffequals'].forEach(function(key) {
            context.keybinding().on([key], zoomIn);
            context.keybinding().on([uiCmd('⌘' + key)], zoomInFurther);
        });

        ['_', '-', 'ffminus', 'dash'].forEach(function(key) {
            context.keybinding().on([key], zoomOut);
            context.keybinding().on([uiCmd('⌘' + key)], zoomOutFurther);
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

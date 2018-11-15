import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiCmd } from './cmd';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiZoom(context) {
    var zooms = [{
        id: 'zoom-in',
        icon: 'plus',
        title: t('zoom.in'),
        action: context.zoomIn,
        key: '+'
    }, {
        id: 'zoom-out',
        icon: 'minus',
        title: t('zoom.out'),
        action: context.zoomOut,
        key: '-'
    }];


    function zoomIn() {
        d3_event.preventDefault();
        context.zoomIn();
    }


    function zoomOut() {
        d3_event.preventDefault();
        context.zoomOut();
    }


    function zoomInFurther() {
        d3_event.preventDefault();
        context.zoomInFurther();
    }


    function zoomOutFurther() {
        d3_event.preventDefault();
        context.zoomOutFurther();
    }


    return function(selection) {
        var button = selection.selectAll('button')
            .data(zooms)
            .enter()
            .append('button')
            .attr('tabindex', -1)
            .attr('class', function(d) { return d.id; })
            .on('click.editor', function(d) { d.action(); })
            .call(tooltip()
                .placement((textDirection === 'rtl') ? 'right' : 'left')
                .html(true)
                .title(function(d) {
                    return uiTooltipHtml(d.title, d.key);
                })
            );

        button.each(function(d) {
            d3_select(this)
                .call(svgIcon('#iD-icon-' + d.icon, 'light'));
        });

        ['plus', 'ffplus', '=', 'ffequals'].forEach(function(key) {
            context.keybinding().on([key], zoomIn);
            context.keybinding().on([uiCmd('⌘' + key)], zoomInFurther);
        });

        ['_', '-', 'ffminus', 'dash'].forEach(function(key) {
            context.keybinding().on([key], zoomOut);
            context.keybinding().on([uiCmd('⌘' + key)], zoomOutFurther);
        });
    };
}

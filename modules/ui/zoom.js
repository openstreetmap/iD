import * as d3 from 'd3';
import _ from 'lodash';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg/index';
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
        d3.event.preventDefault();
        if (!context.inIntro()) context.zoomIn();
    }


    function zoomOut() {
        d3.event.preventDefault();
        if (!context.inIntro()) context.zoomOut();
    }


    function zoomInFurther() {
        d3.event.preventDefault();
        if (!context.inIntro()) context.zoomInFurther();
    }


    function zoomOutFurther() {
        d3.event.preventDefault();
        if (!context.inIntro()) context.zoomOutFurther();
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
            d3.select(this)
                .call(svgIcon('#icon-' + d.icon, 'light'));
        });

        var keybinding = d3keybinding('zoom');

        _.each(['=','ffequals','plus','ffplus'], function(key) {
            keybinding.on([key, '⇧' + key], zoomIn);
            keybinding.on([uiCmd('⌘' + key), uiCmd('⌘⇧' + key)], zoomInFurther);
        });
        _.each(['-','ffminus','dash'], function(key) {
            keybinding.on([key, '⇧' + key], zoomOut);
            keybinding.on([uiCmd('⌘' + key), uiCmd('⌘⇧' + key)], zoomOutFurther);
        });

        d3.select(document)
            .call(keybinding);
    };
}

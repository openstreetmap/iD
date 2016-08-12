import { d3keybinding } from '../../js/lib/d3.keybinding.js';
import * as d3 from 'd3';
import { t } from '../util/locale';
import { tooltip } from '../util/tooltip';
import { Icon } from '../svg/index';
import { cmd } from './cmd';
import { tooltipHtml } from './tooltipHtml';
import _ from 'lodash';

export function Zoom(context) {
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
            .enter().append('button')
            .attr('tabindex', -1)
            .attr('class', function(d) { return d.id; })
            .on('click.editor', function(d) { d.action(); })
            .call(tooltip()
                .placement('left')
                .html(true)
                .title(function(d) {
                    return tooltipHtml(d.title, d.key);
                }));

        button.each(function(d) {
            d3.select(this)
                .call(Icon('#icon-' + d.icon, 'light'));
        });

        var keybinding = d3keybinding('zoom');

        _.each(['=','ffequals','plus','ffplus'], function(key) {
            keybinding.on(key, zoomIn);
            keybinding.on('⇧' + key, zoomIn);
            keybinding.on(cmd('⌘' + key), zoomInFurther);
            keybinding.on(cmd('⌘⇧' + key), zoomInFurther);
        });
        _.each(['-','ffminus','_','dash'], function(key) {
            keybinding.on(key, zoomOut);
            keybinding.on('⇧' + key, zoomOut);
            keybinding.on(cmd('⌘' + key), zoomOutFurther);
            keybinding.on(cmd('⌘⇧' + key), zoomOutFurther);
        });

        d3.select(document)
            .call(keybinding);
    };
}

import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { svgIcon } from '../svg/index';
import { uiCmd } from './cmd';
import { uiInfoWidgets } from './info/index';


export function uiInfo(context) {
    var ids = Object.keys(uiInfoWidgets),
        widgets = {},
        active = {};

    // create widgets
    ids.forEach(function(k) {
        if (!widgets[k]) {
            widgets[k] = uiInfoWidgets[k](context);
            active[k] = false;
        }
    });


    function info(selection) {

        function redraw() {
            var activeids = ids.filter(function(k) { return active[k]; });

            var containers = infobox.selectAll('.widget-container')
                .data(activeids, function(k) { return k; });

            containers.exit()
                .style('opacity', 1)
                .transition()
                .duration(200)
                .style('opacity', 0)
                .on('end', function(d) {
                    d3.select(this)
                        .call(widgets[d].off)
                        .remove();
                });

            var enter = containers.enter()
                .append('div')
                .attr('class', function(d) { return 'fillD2 widget-container widget-container-' + d; });

            enter
                .style('opacity', 0)
                .transition()
                .duration(200)
                .style('opacity', 1);

            var title = enter
                .append('div')
                .attr('class', 'widget-title fillD2');

            title
                .append('h3')
                .text(function(d) { return widgets[d].title; });

            title
                .append('button')
                .attr('class', 'close')
                .on('click', function (d) { toggle(d); })
                .call(svgIcon('#icon-close'));

            enter
                .append('div')
                .attr('class', function(d) { return 'widget-content widget-content-' + d; });


            // redraw the widgets
            infobox.selectAll('.widget-content')
                .each(function(d) {
                    d3.select(this).call(widgets[d]);
                });
        }


        function toggle(which) {
            if (d3.event) d3.event.preventDefault();

            if (!which) which = 'measurement';
            active[which] = !active[which];

            redraw();
        }


        var infobox = selection.selectAll('.infobox')
            .data([0]);

        infobox = infobox.enter()
            .append('div')
            .attr('class', 'infobox')
            .merge(infobox);

        redraw();

        var keybinding = d3keybinding('info')
            .on(uiCmd('⌘' + t('infobox.key')), toggle);

        ids.forEach(function(k) {
            var key = t('infobox.' + k + '.key', { default: null });
            if (!key) return;
            keybinding
                .on(uiCmd('⌘' + key), function() { toggle(k); });
        });

        d3.select(document)
            .call(keybinding);
    }

    return info;
}

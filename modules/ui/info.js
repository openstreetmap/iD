import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { uiCmd } from './cmd';
import { uiInfoWidgets } from './info/index';


export function uiInfo(context) {
    var isHidden = true,
        ids = Object.keys(uiInfoWidgets),
        widgets = {},
        current;

    // create widgets
    ids.forEach(function(k) {
        current = current || k;
        if (!widgets[k]) {
            widgets[k] = uiInfoWidgets[k](context);
        }
    });



    function info(selection) {

        function redraw() {
            if (isHidden || !current) return;
            var widget = widgets[current];

            var content = selection.selectAll('.widget-content-' + current);
            content.call(widget);
        }


        function toggle(setCurrent) {
            current = setCurrent || current;

            if (d3.event) {
                d3.event.preventDefault();
            }

            isHidden = !isHidden;

            if (isHidden) {
                infobox
                    .classed('hide', false)
                    .style('opacity', 1)
                    .transition()
                    .duration(200)
                    .style('opacity', 0)
                    .on('end', function() {
                        d3.select(this).classed('hide', true);
                    });
            } else {
                infobox
                    .classed('hide', false)
                    .style('opacity', 0);

                redraw();

                infobox
                    .transition()
                    .duration(200)
                    .style('opacity', 1);
            }
        }


        var infobox = selection.selectAll('.infobox')
            .data([0]);

        infobox = infobox.enter()
            .append('div')
            .attr('class', 'infobox fillD2' + (isHidden ? ' hide' : ''))
            .merge(infobox);


        var containers = infobox.selectAll('.widget-container')
            .data(ids);

        containers.exit()
            .remove();

        var enter = containers.enter()
            .append('div')
            .attr('class', function(d) { return 'widget-container widget-container-' + d; });

        enter
            .append('div')
            .attr('class', 'widget-title fillD2')
            .append('h3')
            .text(function(d) { return widgets[d].title; });

        enter
            .append('div')
            .attr('class', function(d) { return 'widget-content widget-content-' + d; });


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

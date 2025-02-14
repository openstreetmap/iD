import {
    select as d3_select
} from 'd3-selection';

import { t } from '../core/localizer';
import { svgIcon } from '../svg/icon';
import { uiCmd } from './cmd';
import { uiInfoPanels } from './panels';


export function uiInfo(context) {
    var ids = Object.keys(uiInfoPanels);
    var wasActive = ['measurement'];
    var panels = {};
    var active = {};

    // create panels
    ids.forEach(function(k) {
        if (!panels[k]) {
            panels[k] = uiInfoPanels[k](context);
            active[k] = false;
        }
    });


    function info(selection) {

        function redraw() {
            var activeids = ids.filter(function(k) { return active[k]; }).sort();

            var containers = infoPanels.selectAll('.panel-container')
                .data(activeids, function(k) { return k; });

            containers.exit()
                .style('opacity', 1)
                .transition()
                .duration(200)
                .style('opacity', 0)
                .on('end', function(d) {
                    d3_select(this)
                        .call(panels[d].off)
                        .remove();
                });

            var enter = containers.enter()
                .append('div')
                .attr('class', function(d) { return 'fillD2 panel-container panel-container-' + d; });

            enter
                .style('opacity', 0)
                .transition()
                .duration(200)
                .style('opacity', 1);

            var title = enter
                .append('div')
                .attr('class', 'panel-title fillD2');

            title
                .append('h3')
                .each(function(d) { return panels[d].label(d3_select(this)); });

            title
                .append('button')
                .attr('class', 'close')
                .attr('title', t('icons.close'))
                .on('click', function(d3_event, d) {
                    d3_event.stopImmediatePropagation();
                    d3_event.preventDefault();
                    info.toggle(d);
                })
                .call(svgIcon('#iD-icon-close'));

            enter
                .append('div')
                .attr('class', function(d) { return 'panel-content panel-content-' + d; });


            // redraw the panels
            infoPanels.selectAll('.panel-content')
                .each(function(d) {
                    d3_select(this).call(panels[d]);
                });
        }


        info.toggle = function(which) {
            var activeids = ids.filter(function(k) { return active[k]; });

            if (which) {  // toggle one
                active[which] = !active[which];
                if (activeids.length === 1 && activeids[0] === which) {  // none active anymore
                    wasActive = [which];
                }

                context.container().select('.' + which + '-panel-toggle-item')
                    .classed('active', active[which])
                    .select('input')
                    .property('checked', active[which]);

            } else {      // toggle all
                if (activeids.length) {
                    wasActive = activeids;
                    activeids.forEach(function(k) { active[k] = false; });
                } else {
                    wasActive.forEach(function(k) { active[k] = true; });
                }
            }

            redraw();
        };


        var infoPanels = selection.selectAll('.info-panels')
            .data([0]);

        infoPanels = infoPanels.enter()
            .append('div')
            .attr('class', 'info-panels')
            .merge(infoPanels);

        redraw();

        context.keybinding()
            .on(uiCmd('⌘' + t('info_panels.key')), function(d3_event) {
                d3_event.stopImmediatePropagation();
                d3_event.preventDefault();
                info.toggle();
            });

        ids.forEach(function(k) {
            var key = t('info_panels.' + k + '.key', { default: null });
            if (!key) return;
            context.keybinding()
                .on(uiCmd('⌘⇧' + key), function(d3_event) {
                    d3_event.stopImmediatePropagation();
                    d3_event.preventDefault();
                    info.toggle(k);
                });
        });
    }

    return info;
}

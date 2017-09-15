import * as d3 from 'd3';
import { d3keybinding } from '../lib/d3.keybinding.js';
import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { uiCmd } from './cmd';
import { uiInfoPanels } from './panels/index';


export function uiInfo(context) {
    var ids = Object.keys(uiInfoPanels),
        wasActive = ['measurement'],
        panels = {},
        active = {};

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
                    d3.select(this)
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
                .text(function(d) { return panels[d].title; });

            title
                .append('button')
                .attr('class', 'close')
                .on('click', function (d) { toggle(d); })
                .call(svgIcon('#icon-close'));

            enter
                .append('div')
                .attr('class', function(d) { return 'panel-content panel-content-' + d; });


            // redraw the panels
            infoPanels.selectAll('.panel-content')
                .each(function(d) {
                    d3.select(this).call(panels[d]);
                });
        }


        function toggle(which) {
            if (d3.event) {
                d3.event.stopImmediatePropagation();
                d3.event.preventDefault();
            }

            var activeids = ids.filter(function(k) { return active[k]; });

            if (which) {  // toggle one
                active[which] = !active[which];
                if (activeids.length === 1 && activeids[0] === which) {  // none active anymore
                    wasActive = [which];
                }
            } else {      // toggle all
                if (activeids.length) {
                    wasActive = activeids;
                    activeids.forEach(function(k) { active[k] = false; });
                } else {
                    wasActive.forEach(function(k) { active[k] = true; });
                }
            }

            redraw();
        }


        var infoPanels = selection.selectAll('.info-panels')
            .data([0]);

        infoPanels = infoPanels.enter()
            .append('div')
            .attr('class', 'info-panels')
            .merge(infoPanels);

        redraw();

        var keybinding = d3keybinding('info')
            .on(uiCmd('⌘' + t('info_panels.key')), toggle);

        ids.forEach(function(k) {
            var key = t('info_panels.' + k + '.key', { default: null });
            if (!key) return;
            keybinding
                .on(uiCmd('⌘⇧' + key), function() { toggle(k); });
        });

        d3.select(document)
            .call(keybinding);
    }

    return info;
}

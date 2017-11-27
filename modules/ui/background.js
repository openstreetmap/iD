import _debounce from 'lodash-es/debounce';

import {
    descending as d3_descending,
    ascending as d3_ascending
} from 'd3-array';

import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg';
import { uiBackgroundOffset } from './background_offset';
import { uiCmd } from './cmd';
import { uiMapInMap } from './map_in_map';
import { uiTooltipHtml } from './tooltipHtml';
import { utilDetect } from '../util/detect';
import { utilSetTransform, utilCallWhenIdle } from '../util';
import { tooltip } from '../util/tooltip';


export function uiBackground(context) {
    var key = t('background.key'),
        detected = utilDetect(),
        opacities = [1, 0.75, 0.5, 0.25],
        opacityDefault = (context.storage('background-opacity') !== null) ?
            (+context.storage('background-opacity')) : 1.0,
        customSource = context.background().findSource('custom'),
        previous;

    var backgroundOffset = uiBackgroundOffset(context);


    // Can be 0 from <1.3.0 use or due to issue #1923.
    if (opacityDefault === 0) opacityDefault = 1.0;


    function background(selection) {

        function sortSources(a, b) {
            return a.best() && !b.best() ? -1
                : b.best() && !a.best() ? 1
                : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
        }


        function setOpacity(d) {
            var bg = context.container().selectAll('.layer-background')
                .transition()
                .style('opacity', d)
                .attr('data-opacity', d);

            if (!detected.opera) {
                utilSetTransform(bg, 0, 0);
            }

            opacityList.selectAll('li')
                .classed('active', function(_) { return _ === d; });

            context.storage('background-opacity', d);
        }


        function setTooltips(selection) {
            selection.each(function(d, i, nodes) {
                var item = d3_select(this).select('label'),
                    span = item.select('span'),
                    placement = (i < nodes.length / 2) ? 'bottom' : 'top',
                    description = d.description(),
                    isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

                if (d === previous) {
                    item.call(tooltip()
                        .placement(placement)
                        .html(true)
                        .title(function() {
                            var tip = '<div>' + t('background.switch') + '</div>';
                            return uiTooltipHtml(tip, uiCmd('⌘' + key));
                        })
                    );
                } else if (description || isOverflowing) {
                    item.call(tooltip()
                        .placement(placement)
                        .title(description || d.name())
                    );
                } else {
                    item.call(tooltip().destroy);
                }
            });
        }


        function selectLayer() {
            function active(d) {
                return context.background().showsLayer(d);
            }

            content.selectAll('.layer')
                .classed('active', active)
                .classed('switch', function(d) { return d === previous; })
                .call(setTooltips)
                .selectAll('input')
                .property('checked', active);
        }


        function clickSetSource(d) {
            if (d.id === 'custom' && !d.template()) {
                return editCustom();
            }

            d3_event.preventDefault();
            previous = context.background().baseLayerSource();
            context.background().baseLayerSource(d);
            selectLayer();
            document.activeElement.blur();
        }


        function editCustom() {
            d3_event.preventDefault();
            var example = 'https://{switch:a,b,c}.tile.openstreetmap.org/{zoom}/{x}/{y}.png';
            var template = window.prompt(
                t('background.custom_prompt', { example: example }),
                customSource.template() || example
            );

            if (template) {
                context.storage('background-custom-template', template);
                customSource.template(template);
                clickSetSource(customSource);
            } else {
                selectLayer();
            }
        }


        function clickSetOverlay(d) {
            d3_event.preventDefault();
            context.background().toggleOverlayLayer(d);
            selectLayer();
            document.activeElement.blur();
        }


        function drawList(layerList, type, change, filter) {
            var sources = context.background()
                .sources(context.map().extent())
                .filter(filter);

            var layerLinks = layerList.selectAll('li.layer')
                .data(sources, function(d) { return d.name(); });

            layerLinks.exit()
                .remove();

            var enter = layerLinks.enter()
                .append('li')
                .attr('class', 'layer')
                .classed('layer-custom', function(d) { return d.id === 'custom'; })
                .classed('best', function(d) { return d.best(); });

            enter.filter(function(d) { return d.id === 'custom'; })
                .append('button')
                .attr('class', 'layer-browse')
                .call(tooltip()
                    .title(t('background.custom_button'))
                    .placement((textDirection === 'rtl') ? 'right' : 'left'))
                .on('click', editCustom)
                .call(svgIcon('#icon-search'));

            enter.filter(function(d) { return d.best(); })
                .append('div')
                .attr('class', 'best')
                .call(tooltip()
                    .title(t('background.best_imagery'))
                    .placement((textDirection === 'rtl') ? 'right' : 'left'))
                .append('span')
                .html('&#9733;');

            var label = enter
                .append('label');

            label
                .append('input')
                .attr('type', type)
                .attr('name', 'layers')
                .on('change', change);

            label
                .append('span')
                .text(function(d) { return d.name(); });


            layerList.selectAll('li.layer')
                .sort(sortSources)
                .style('display', layerList.selectAll('li.layer').data().length > 0 ? 'block' : 'none');
        }


        function update() {
            backgroundList
                .call(drawList, 'radio', clickSetSource, function(d) { return !d.isHidden() && !d.overlay; });

            overlayList
                .call(drawList, 'checkbox', clickSetOverlay, function(d) { return !d.isHidden() && d.overlay; });

            selectLayer();

            offsetContainer
                .call(backgroundOffset);
        }


        function hide() {
            setVisible(false);
        }


        function toggle() {
            if (d3_event) {
                d3_event.preventDefault();
            }
            tooltipBehavior.hide(button);
            setVisible(!button.classed('active'));
        }


        function quickSwitch() {
            if (d3_event) {
                d3_event.stopImmediatePropagation();
                d3_event.preventDefault();
            }
            if (previous) {
                clickSetSource(previous);
            }
        }


        function setVisible(show) {
            if (show !== shown) {
                button.classed('active', show);
                shown = show;

                if (show) {
                    selection
                        .on('mousedown.background-inside', function() {
                            d3_event.stopPropagation();
                        });

                    content
                        .style('display', 'block')
                        .style('right', '-300px')
                        .transition()
                        .duration(200)
                        .style('right', '0px');

                    content.selectAll('.layer')
                        .call(setTooltips);

                } else {
                    content
                        .style('display', 'block')
                        .style('right', '0px')
                        .transition()
                        .duration(200)
                        .style('right', '-300px')
                        .on('end', function() {
                            d3_select(this).style('display', 'none');
                        });

                    selection
                        .on('mousedown.background-inside', null);
                }
            }
        }


        var content = selection
            .append('div')
            .attr('class', 'fillL map-overlay col3 content hide');

        var tooltipBehavior = tooltip()
            .placement((textDirection === 'rtl') ? 'right' : 'left')
            .html(true)
            .title(uiTooltipHtml(t('background.description'), key));

        var button = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', toggle)
            .call(svgIcon('#icon-layers', 'light'))
            .call(tooltipBehavior);

        var shown = false;


        /* add opacity switcher */
        var opawrap = content
            .append('div')
            .attr('class', 'opacity-options-wrapper');

        opawrap
            .append('h4')
            .text(t('background.title'));

        var opacityList = opawrap
            .append('ul')
            .attr('class', 'opacity-options');

        opacityList.selectAll('div.opacity')
            .data(opacities)
            .enter()
            .append('li')
            .attr('data-original-title', function(d) {
                return t('background.percent_brightness', { opacity: (d * 100) });
            })
            .on('click.set-opacity', setOpacity)
            .html('<div class="select-box"></div>')
            .call(tooltip()
                .placement((textDirection === 'rtl') ? 'right' : 'left'))
            .append('div')
            .attr('class', 'opacity')
            .style('opacity', function(d) { return 1.25 - d; });


        /* add background list */
        var backgroundList = content
            .append('ul')
            .attr('class', 'layer-list')
            .attr('dir', 'auto');

            // "Where does this imagery come from?"
        // content
        //     .append('div')
        //     .attr('class', 'imagery-faq')
        //     .append('a')
        //     .attr('target', '_blank')
        //     .attr('tabindex', -1)
        //     .call(svgIcon('#icon-out-link', 'inline'))
        //     .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
        //     .append('span')
        //     .text(t('background.imagery_source_faq'));


        /* add overlay list */
        var overlayList = content
            .append('ul')
            .attr('class', 'layer-list');

        var controls = content
            .append('div')
            .attr('class', 'controls-list');


        /* add minimap toggle */
        var minimapLabel = controls
            .append('label')
            .call(tooltip()
                .html(true)
                .title(uiTooltipHtml(t('background.minimap.tooltip'), t('background.minimap.key')))
                .placement('top')
            );

        minimapLabel
            .classed('minimap-toggle', true)
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                uiMapInMap.toggle();
                d3_event.preventDefault();
            });

        minimapLabel
            .append('span')
            .text(t('background.minimap.description'));


        /* add offset controls */
        var offsetContainer = content
            .append('div')
            .attr('class', 'background-offset');


        /* add listeners */
        context.map()
            .on('move.background-update', _debounce(utilCallWhenIdle(update), 1000));

        context.background()
            .on('change.background-update', update);


        update();
        setOpacity(opacityDefault);

        var keybinding = d3_keybinding('background')
            .on(key, toggle)
            .on(uiCmd('⌘' + key), quickSwitch)
            .on([t('map_data.key'), t('help.key')], hide);

        d3_select(document)
            .call(keybinding);
    }

    return background;
}

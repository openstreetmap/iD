import _debounce from 'lodash-es/debounce';

import {
    descending as d3_descending,
    ascending as d3_ascending
} from 'd3-array';

import {
    event as d3_event,
    select as d3_select,
    selectAll as d3_selectAll
} from 'd3-selection';

import { d3keybinding as d3_keybinding } from '../lib/d3.keybinding.js';

import { t, textDirection } from '../util/locale';
import { geoMetersToOffset, geoOffsetToMeters } from '../geo';
import { utilDetect } from '../util/detect';
import { utilSetTransform, utilCallWhenIdle } from '../util';
import { svgIcon } from '../svg';
import { uiMapInMap } from './map_in_map';
import { uiCmd } from './cmd';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiBackground(context) {
    var key = t('background.key'),
        detected = utilDetect(),
        opacities = [1, 0.75, 0.5, 0.25],
        directions = [
            ['right', [0.5, 0]],
            ['top', [0, -0.5]],
            ['left', [-0.5, 0]],
            ['bottom', [0, 0.5]]],
        opacityDefault = (context.storage('background-opacity') !== null) ?
            (+context.storage('background-opacity')) : 1.0,
        customSource = context.background().findSource('custom'),
        previous;

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
            backgroundList.call(drawList, 'radio', clickSetSource, function(d) { return !d.isHidden() && !d.overlay; });
            overlayList.call(drawList, 'checkbox', clickSetOverlay, function(d) { return !d.isHidden() && d.overlay; });

            selectLayer();
            updateOffsetVal();
        }


        function updateOffsetVal() {
            var meters = geoOffsetToMeters(context.background().offset()),
                x = +meters[0].toFixed(2),
                y = +meters[1].toFixed(2);

            d3_selectAll('.nudge-inner-rect')
                .select('input')
                .classed('error', false)
                .property('value', x + ', ' + y);

            d3_selectAll('.nudge-reset')
                .classed('disabled', function() {
                    return (x === 0 && y === 0);
                });
        }


        function resetOffset() {
            if (d3_event.button !== 0) return;
            context.background().offset([0, 0]);
            updateOffsetVal();
        }


        function nudge(d) {
            context.background().nudge(d, context.map().zoom());
            updateOffsetVal();
        }


        function buttonOffset(d) {
            if (d3_event.button !== 0) return;
            var timeout = window.setTimeout(function() {
                    interval = window.setInterval(nudge.bind(null, d), 100);
                }, 500),
                interval;

            function doneNudge() {
                window.clearTimeout(timeout);
                window.clearInterval(interval);
                d3_select(window)
                    .on('mouseup.buttonoffset', null, true)
                    .on('mousedown.buttonoffset', null, true);
            }

            d3_select(window)
                .on('mouseup.buttonoffset', doneNudge, true)
                .on('mousedown.buttonoffset', doneNudge, true);

            nudge(d);
        }


        function inputOffset() {
            if (d3_event.button !== 0) return;
            var input = d3_select(this);
            var d = input.node().value;

            if (d === '') return resetOffset();

            d = d.replace(/;/g, ',').split(',').map(function(n) {
                // if n is NaN, it will always get mapped to false.
                return !isNaN(n) && n;
            });

            if (d.length !== 2 || !d[0] || !d[1]) {
                input.classed('error', true);
                return;
            }

            context.background().offset(geoMetersToOffset(d));
            updateOffsetVal();
        }


        function dragOffset() {
            if (d3_event.button !== 0) return;
            var origin = [d3_event.clientX, d3_event.clientY];

            context.container()
                .append('div')
                .attr('class', 'nudge-surface');

            d3_select(window)
                .on('mousemove.offset', function() {
                    var latest = [d3_event.clientX, d3_event.clientY];
                    var d = [
                        -(origin[0] - latest[0]) / 4,
                        -(origin[1] - latest[1]) / 4
                    ];

                    origin = latest;
                    nudge(d);
                })
                .on('mouseup.offset', function() {
                    if (d3_event.button !== 0) return;
                    d3_selectAll('.nudge-surface')
                        .remove();

                    d3_select(window)
                        .on('mousemove.offset', null)
                        .on('mouseup.offset', null);
                });

            d3_event.preventDefault();
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
                .attr('class', 'fillL map-overlay col3 content hide'),
            tooltipBehavior = tooltip()
                .placement((textDirection === 'rtl') ? 'right' : 'left')
                .html(true)
                .title(uiTooltipHtml(t('background.description'), key)),
            button = selection
                .append('button')
                .attr('tabindex', -1)
                .on('click', toggle)
                .call(svgIcon('#icon-layers', 'light'))
                .call(tooltipBehavior),
            shown = false;


        /* opacity switcher */

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


        /* background list */

        var backgroundList = content
            .append('ul')
            .attr('class', 'layer-list')
            .attr('dir', 'auto');

        content
            .append('div')
            .attr('class', 'imagery-faq')
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-out-link', 'inline'))
            .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
            .append('span')
            .text(t('background.imagery_source_faq'));


        /* overlay list */

        var overlayList = content
            .append('ul')
            .attr('class', 'layer-list');

        var controls = content
            .append('div')
            .attr('class', 'controls-list');


        /* minimap toggle */

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


        /* imagery offset controls */

        var adjustments = content
            .append('div')
            .attr('class', 'adjustments');

        adjustments
            .append('a')
            .text(t('background.fix_misalignment'))
            .attr('href', '#')
            .classed('hide-toggle', true)
            .classed('expanded', false)
            .on('click', function() {
                if (d3_event.button !== 0) return;
                var exp = d3_select(this).classed('expanded');
                nudgeContainer.style('display', exp ? 'none' : 'block');
                d3_select(this).classed('expanded', !exp);
                d3_event.preventDefault();
            });

        var nudgeContainer = adjustments
            .append('div')
            .attr('class', 'nudge-container cf')
            .style('display', 'none');

        nudgeContainer
            .append('div')
            .attr('class', 'nudge-instructions')
            .text(t('background.offset'));

        var nudgeRect = nudgeContainer
            .append('div')
            .attr('class', 'nudge-outer-rect')
            .on('mousedown', dragOffset);

        nudgeRect
            .append('div')
            .attr('class', 'nudge-inner-rect')
            .append('input')
            .on('change', inputOffset)
            .on('mousedown', function() {
                if (d3_event.button !== 0) return;
                d3_event.stopPropagation();
            });

        nudgeContainer
            .append('div')
            .selectAll('button')
            .data(directions).enter()
            .append('button')
            .attr('class', function(d) { return d[0] + ' nudge'; })
            .on('mousedown', function(d) {
                if (d3_event.button !== 0) return;
                buttonOffset(d[1]);
            });

        nudgeContainer
            .append('button')
            .attr('title', t('background.reset'))
            .attr('class', 'nudge-reset disabled')
            .on('click', resetOffset)
            .call(
                (textDirection === 'rtl') ? svgIcon('#icon-redo') : svgIcon('#icon-undo')
            );

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

import { debounce, sortBy } from 'es-toolkit';
import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import { select as d3_select } from 'd3-selection';

import { prefs } from '../../core/preferences';
import { t, localizer } from '../../core/localizer';
import { uiTooltip } from '../tooltip';
import { svgIcon } from '../../svg/icon';
import { uiCmd } from '../cmd';
import { uiSettingsCustomBackground } from '../settings/custom_background';
import { uiMapInMap } from '../map_in_map';
import { uiSection } from '../section';

export function uiSectionBackgroundList(context) {

    var _backgroundList = d3_select(null);

    var _settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);

    var section = uiSection('background-list', context)
        .label(() => t.append('background.backgrounds'))
        .disclosureContent(renderDisclosureContent);

    function previousBackgroundID() {
        return prefs('background-last-used-toggle');
    }

    function renderDisclosureContent(selection) {

        // the background list
        var container = selection.selectAll('.layer-background-list')
            .data([0]);

        _backgroundList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-background-list')
            .merge(container);


        // add minimap toggle below list
        var bgExtrasListEnter = selection.selectAll('.bg-extras-list')
            .data([0])
            .enter()
            .append('ul')
            .attr('class', 'layer-list bg-extras-list');

        var minimapLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'minimap-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('background.minimap.tooltip'))
                .keys([t('background.minimap.key')])
                .placement('top')
            );

        minimapLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event) {
                d3_event.preventDefault();
                uiMapInMap.toggle();
            });

        minimapLabelEnter
            .append('span')
            .call(t.append('background.minimap.description'));


        var panelLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'background-panel-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('background.panel.tooltip'))
                .keys([uiCmd('⌘⇧' + t('info_panels.background.key'))])
                .placement('top')
            );

        panelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event) {
                d3_event.preventDefault();
                context.ui().info.toggle('background');
            });

        panelLabelEnter
            .append('span')
            .call(t.append('background.panel.description'));

        var locPanelLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'location-panel-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(() => t.append('background.location_panel.tooltip'))
                .keys([uiCmd('⌘⇧' + t('info_panels.location.key'))])
                .placement('top')
            );

        locPanelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function(d3_event) {
                d3_event.preventDefault();
                context.ui().info.toggle('location');
            });

        locPanelLabelEnter
            .append('span')
            .call(t.append('background.location_panel.description'));


        // "Info / Report a Problem" link
        selection.selectAll('.imagery-faq')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'imagery-faq')
            .append('a')
            .attr('target', '_blank')
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .attr('href', 'https://github.com/openstreetmap/iD/blob/develop/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
            .append('span')
            .call(t.append('background.imagery_problem_faq'));

        _backgroundList
            .call(drawListItems, 'radio', function(d3_event, d) {
                chooseBackground(d);
            }, function(d) {
                return !d.isHidden() && !d.overlay;
            });
    }

    function setTooltips(selection) {
        selection.each(function(d, i, nodes) {
            const item = d3_select(this).select('label');
            const select = d3_select(this).select('select').node();
            if (select) {
                d = d.variants[select.selectedIndex].source;
            }
            const hasDescription = d.hasDescription();
            const span = item.select('span');
            const isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));
            const placement = (i < nodes.length / 2) ? 'bottom' : 'top';

            item.call(uiTooltip().destroyAny);

            if (d.id === previousBackgroundID()) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title(() => t.append('background.switch'))
                    .keys([uiCmd('⌘' + t('background.key'))])
                );
            } else if (hasDescription || isOverflowing) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title(() => hasDescription ? d.description() : d.label())
                );
            }
        });
    }


    function drawListItems(layerList, type, change, filter) {
        const sources = [];
        const dateLikeRegex = /(.+?\s\(?)((?:[-\/, 0-9]{2,}|DTM|DSM|DOM)+\s*)(\)?(?:\s|$).*)/;
        context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(filter)
            .sort(function(a, b) {
                return a.best() && !b.best() ? -1
                    : b.best() && !a.best() ? 1
                    : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
            })
            .forEach(source => {
                const name = source.name();
                if (dateLikeRegex.test(name)) {
                    const [ prefix, variant, suffix ] = name.match(dateLikeRegex).slice(1);
                    const main = sources.find((s) =>
                        s.prefix === prefix && s.suffix === suffix);
                    if (main) {
                        main.variants.push({ variant, source });
                    } else {
                        sources.push({
                            ...source,
                            prefix,
                            suffix,
                            variants: [{ variant, source }]
                        });
                    }
                } else {
                    sources.push({
                        ...source,
                        variants: [{ source }]
                    });
                }
            });
        sources.forEach(source => {
                source.variants = sortBy(source.variants, [
                    variant => variant.source.best(),
                    variant => variant.variant
                ]).reverse();
            });

        var layerLinks = layerList.selectAll('li')
            // We have to be a bit inefficient about reordering the list since
            // arrow key navigation of radio values likes to work in the order
            // they were added, not the display document order.
            .data(sources, function(d, i) { return d.id + '---' + i; });

        layerLinks.exit()
            .remove();

        var enter = layerLinks.enter()
            .append('li')
            .classed('layer-custom', function(d) { return d.id === 'custom'; })
            .classed('best', function(d) { return d.best(); });

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', 'background-layer')
            .attr('value', function(d) {
                return d.id;
            })
            .on('change', function(d3_event, d) {
                if (d.variants.length > 1) {
                    const selectedVariantIndex = d3_select(this.parentElement).select('select').node().selectedIndex;
                    change(d3_event, d.variants[selectedVariantIndex].source);
                } else {
                    change(d3_event, d);
                }
            });

        label
            .append('span')
            .each(function(d) {
                const self = d3_select(this);
                if (d.variants.length > 1) {
                    self.append('span').text(d.prefix + ' ');
                    self.append('select')
                        .on('change', function(d3_event, d) {
                            change(d3_event, d.variants[this.selectedIndex].source);
                        })
                        .selectAll('option')
                        .data(d => d.variants)
                        .enter()
                        .append('option')
                        .attr('value', d => d.source.id)
                        .text(d => d.variant);
                    self.append('span').text(' ' + d.suffix);
                } else {
                    d.label()(self);
                }
            });

        enter.filter(function(d) { return d.id === 'custom'; })
            .append('button')
            .attr('class', 'layer-browse')
            .call(uiTooltip()
                .title(() => t.append('settings.custom_background.tooltip'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function(d3_event) {
                d3_event.preventDefault();
                editCustom();
            })
            .call(svgIcon('#iD-icon-more'));

        enter.filter(function(d) { return d.best(); })
            .append('div')
            .attr('class', 'best')
            .call(uiTooltip()
                .title(() => t.append('background.best_imagery'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .append('span')
            .text('★');

        layerList
            .call(updateLayerSelections);
    }

    function updateLayerSelections(selection) {
        function active(d) {
            return d.variants.some((variant) =>
                context.background().showsLayer(variant.source));
        }

        const item = selection.selectAll('li')
            .classed('active', active)
            .classed('switch', (d) => d.variants.some((variant) =>
                variant.source.id === previousBackgroundID()))
            .call(setTooltips);
        item.selectAll('input')
            .property('checked', active);
        item.filter(active)
            .selectAll('select')
            .property('selectedIndex', (d) =>
                d.variants.findIndex((variant) =>
                    context.background().showsLayer(variant.source)));
    }


    function chooseBackground(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        var previousBackground = context.background().baseLayerSource();
        prefs('background-last-used-toggle', previousBackground.id);
        prefs('background-last-used', d.id);
        context.background().baseLayerSource(d);
    }


    function customChanged(d) {
        var background = context.background();
        var customSource = background.findSource('custom');
        if (!customSource) return;

        if (d && d.template) {
            customSource.template(d.template);
            chooseBackground(customSource);
        } else {
            customSource.template('');
            var noneSource = background.findSource('none');
            if (noneSource) {
                chooseBackground(noneSource);
            }
        }
    }


    function editCustom() {
        context.container()
            .call(_settingsCustomBackground);
    }


    context.background()
        .on('change.background_list', function() {
            _backgroundList.call(updateLayerSelections);
        });

    context.map()
        .on('move.background_list',
            debounce(function() {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}

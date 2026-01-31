import _debounce from 'lodash-es/debounce';
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
            .attr('dir', 'auto')
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
            .on('change', function (d3_event) {
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
            .on('change', function (d3_event) {
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
            .on('change', function (d3_event) {
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
            .call(drawListItems, 'radio', function (d3_event, d) {
                chooseBackground(d);
            }, function (d) {
                return !d.isHidden() && !d.overlay;
            });
    }

    function setTooltips(selection) {
        selection.each(function (d, i, nodes) {
            var item = d3_select(this).select('label');
            var span = item.select('span');
            var placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            var hasDescription = d.hasDescription();
            var isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

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
        var sources = context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(filter)
            .sort(function (a, b) {
                return a.best() && !b.best() ? -1
                    : b.best() && !a.best() ? 1
                        : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
            });

        var layerLinks = layerList.selectAll('li')
            // We have to be a bit inefficient about reordering the list since
            // arrow key navigation of radio values likes to work in the order
            // they were added, not the display document order.
            .data(sources, function (d, i) { return d.id + '---' + i; });

        layerLinks.exit()
            .remove();

        var enter = layerLinks.enter()
            .append('li')
            .classed('layer-custom', function (d) { return d.id === 'custom'; })
            .classed('best', function (d) { return d.best(); });

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', 'background-layer')
            .attr('value', function (d) {
                return d.id;
            })
            .on('change', change);

        label
            .append('span')
            .each(function (d) { d.label()(d3_select(this)); });

        enter.filter(function (d) { return d.id === 'custom' || d.id?.startsWith('custom-'); })
            .append('button')
            .attr('class', 'layer-browse')
            .each(function (d) {
                d3_select(this).call(uiTooltip()
                    .title(() => d.id === 'custom' ? t.append('settings.custom_background.tooltip') : t.append('settings.custom_background.edit'))
                    .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
                );
            })
            .on('click', function (d3_event, d) {
                d3_event.preventDefault();
                editCustom(d.id);
            })
            .each(function (d) {
                d3_select(this).call(svgIcon(d.id === 'custom' ? '#iD-icon-plus' : '#iD-icon-more'));
            });

        enter.filter(function (d) { return d.id?.startsWith('custom-'); })
            .append('button')
            .attr('class', 'layer-delete')
            .call(uiTooltip()
                .title(() => t.append('icons.remove'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', function (d3_event, d) {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                deleteCustom(d.id);
            })
            .call(svgIcon('#iD-icon-close'));

        enter.filter(function (d) { return d.best(); })
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
            return context.background().showsLayer(d);
        }

        selection.selectAll('li')
            .classed('active', active)
            .classed('switch', function (d) { return d.id === previousBackgroundID(); })
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
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


    function customChanged(d, customId) {
        if (d && d.template) {
            let customTemplates = [];
            try {
                customTemplates = JSON.parse(prefs('background-custom-templates') || '[]');
            } catch {
                customTemplates = [];
            }

            if (customId === 'custom') {
                const newId = `custom-${Date.now()}`;
                const customName = d.name || `Custom ${customTemplates.length + 1}`;
                customTemplates.push({ id: newId, template: d.template, name: customName });
                prefs('background-custom-templates', JSON.stringify(customTemplates));
                window.location.reload();
            } else {
                const existing = customTemplates.find(c => c.id === customId);
                if (existing) {
                    existing.template = d.template;
                    if (d.name) {
                        existing.name = d.name;
                    }
                    prefs('background-custom-templates', JSON.stringify(customTemplates));
                }
                const source = context.background().findSource(customId);
                if (source) {
                    source.template(d.template);
                    chooseBackground(source);
                }
            }
        } else if (customId !== 'custom') {
            deleteCustom(customId);
        }
    }


    function editCustom(customId) {
        const settingsCustom = uiSettingsCustomBackground(context)
            .on('change', (d) => customChanged(d, customId));

        if (customId && customId !== 'custom') {
            const source = context.background().findSource(customId);
            if (source) {
                prefs('background-custom-template', source.template());
                // Also set the name pref for editing
                let customTemplates = [];
                try {
                    customTemplates = JSON.parse(prefs('background-custom-templates') || '[]');
                } catch {
                    customTemplates = [];
                }
                const existing = customTemplates.find(c => c.id === customId);
                prefs('background-custom-name', existing?.name || '');
            }
        } else {
            prefs('background-custom-template', '');
            prefs('background-custom-name', '');
        }

        context.container()
            .call(settingsCustom);
    }


    function deleteCustom(customId) {
        if (!customId || customId === 'custom') return;

        let customTemplates = [];
        try {
            const stored = localStorage.getItem('background-custom-templates');
            customTemplates = stored ? JSON.parse(stored) : [];
        } catch {
            customTemplates = [];
        }

        customTemplates = customTemplates.filter(c => c.id !== customId);
        localStorage.setItem('background-custom-templates', JSON.stringify(customTemplates));
        localStorage.removeItem('background-custom-template');
        localStorage.removeItem('background-custom-name');
        window.location.reload();
    }


    context.background()
        .on('change.background_list', function () {
            _backgroundList.call(updateLayerSelections);
        });

    context.map()
        .on('move.background_list',
            _debounce(function () {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}

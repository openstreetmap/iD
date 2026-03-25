import { debounce } from 'es-toolkit/compat';
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
import {
    ESRI_WAYBACK_ID,
    renderWaybackRowContent,
    updateWaybackRow,
    selectWaybackAndUpdateRow,
    refreshWaybackDropdownFromApi
} from './background_list_wayback.js';

export function uiSectionBackgroundList(context) {

    let _backgroundList = d3_select(null);

    const _settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);

    const section = uiSection('background-list', context)
        .label(() => t.append('background.backgrounds'))
        .disclosureContent(renderDisclosureContent);

    /**
     * @returns {string} Previous background ID used for switch shortcut.
     */
    function previousBackgroundID() {
        return prefs('background-last-used-toggle');
    }

    function renderDisclosureContent(selection) {

        // the background list
        const container = selection.selectAll('.layer-background-list')
            .data([0]);

        _backgroundList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-background-list')
            .attr('dir', 'auto')
            .merge(container);


        // add minimap toggle below list
        const bgExtrasListEnter = selection.selectAll('.bg-extras-list')
            .data([0])
            .enter()
            .append('ul')
            .attr('class', 'layer-list bg-extras-list');

        const minimapLabelEnter = bgExtrasListEnter
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


        const panelLabelEnter = bgExtrasListEnter
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

        const locPanelLabelEnter = bgExtrasListEnter
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
            const span = item.select('span');
            const placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            const hasDescription = d.hasDescription();
            const isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

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
        let sources = context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(filter)
            .sort(function(a, b) {
                return a.best() && !b.best() ? -1
                    : b.best() && !a.best() ? 1
                    : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
            });

        const waybackIndex = sources.findIndex(source => source.id === ESRI_WAYBACK_ID);
        const worldImageryIndex = sources.findIndex(source => source.id === 'EsriWorldImagery');
        if (waybackIndex >= 0 && worldImageryIndex >= 0 && waybackIndex !== worldImageryIndex + 1) {
            const [waybackSource] = sources.splice(waybackIndex, 1);
            const insertIndex = worldImageryIndex < waybackIndex ? worldImageryIndex + 1 : worldImageryIndex;
            sources.splice(insertIndex, 0, waybackSource);
        }

        const layerLinks = layerList.selectAll('li')
            // We have to be a bit inefficient about reordering the list since
            // arrow key navigation of radio values likes to work in the order
            // they were added, not the display document order.
            .data(sources, function(d, i) { return d.id + '---' + i; });

        layerLinks.exit()
            .remove();

        const enter = layerLinks.enter()
            .append('li')
            .classed('layer-custom', function(d) { return d.id === 'custom'; })
            .classed('best', function(d) { return d.best(); });

        const label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', 'background-layer')
            .attr('value', function(d) {
                return d.id;
            })
            .on('change', change);

        label
            .append('span')
            .each(function(d) { d.label()(d3_select(this)); });

        // Esri Wayback row: spinner next to label, dropdown (via helper)
        const waybackEnter = enter.filter(function(d) { return d.id === ESRI_WAYBACK_ID; });
        renderWaybackRowContent(waybackEnter, context, {
            onDateFocus: waybackDateFocus,
            onDateChange: waybackDateChange
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
            return context.background().showsLayer(d);
        }

        selection.selectAll('li')
            .classed('active', active)
            .classed('switch', function(d) { return d.id === previousBackgroundID(); })
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);

        // Update wayback row (dropdown visibility and options when already loaded)
        selection.selectAll('li')
            .filter(function(d) { return d && d.id === ESRI_WAYBACK_ID; })
            .each(function(d) {
                const waybackSource = d;
                const li = d3_select(this);
                updateWaybackRow(li, waybackSource);
            });
    }

    /**
     * @param {d3.Selection} dropdown - Selection of the wayback date select element.
     */
    function waybackDateFocus(dropdown) {
        const waybackSource = context.background().findSource(ESRI_WAYBACK_ID);
        if (!waybackSource) return;
        const listItem = dropdown.node() && dropdown.node().closest('li');
        const li = listItem ? d3_select(listItem) : null;
        if (!li.empty()) {
            refreshWaybackDropdownFromApi(waybackSource, li, context);
        }
    }

    function waybackDateChange(d3_event) {
        const waybackSource = context.background().findSource(ESRI_WAYBACK_ID);
        if (waybackSource) {
            const selectedDate = d3_event.target.value;
            waybackSource.date(selectedDate || null);
            context.background().baseLayerSource(waybackSource);
        }
    }

    function chooseBackground(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        const previousBackground = context.background().baseLayerSource();
        if (d.id === ESRI_WAYBACK_ID) {
            const waybackLi = _backgroundList.selectAll('li').filter(function(row) {
                return row && row.id === ESRI_WAYBACK_ID;
            });
            selectWaybackAndUpdateRow(d, waybackLi, context, function() {
                prefs('background-last-used-toggle', previousBackground.id);
                prefs('background-last-used', d.id);
                context.background().baseLayerSource(d);
            });
            return;
        }

        prefs('background-last-used-toggle', previousBackground.id);
        prefs('background-last-used', d.id);
        context.background().baseLayerSource(d);
    }


    function customChanged(d) {
        const background = context.background();
        const customSource = background.findSource('custom');
        if (!customSource) return;

        if (d && d.template) {
            customSource.template(d.template);
            chooseBackground(customSource);
        } else {
            customSource.template('');
            const noneSource = background.findSource('none');
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

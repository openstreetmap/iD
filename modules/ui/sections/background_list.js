import _debounce from 'lodash-es/debounce';
import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import {
    event as d3_event,
    select as d3_select
} from 'd3-selection';

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

    var _customSource = context.background().findSource('custom');

    var _settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);

    var section = uiSection('background-list', context)
        .title(t('background.backgrounds'))
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
                .title(t('background.minimap.tooltip'))
                .keys([t('background.minimap.key')])
                .placement('top')
            );

        minimapLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                d3_event.preventDefault();
                uiMapInMap.toggle();
            });

        minimapLabelEnter
            .append('span')
            .text(t('background.minimap.description'));


        var panelLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'background-panel-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(t('background.panel.tooltip'))
                .keys([uiCmd('⌘⇧' + t('info_panels.background.key'))])
                .placement('top')
            );

        panelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                d3_event.preventDefault();
                context.ui().info.toggle('background');
            });

        panelLabelEnter
            .append('span')
            .text(t('background.panel.description'));

        var locPanelLabelEnter = bgExtrasListEnter
            .append('li')
            .attr('class', 'location-panel-toggle-item')
            .append('label')
            .call(uiTooltip()
                .title(t('background.location_panel.tooltip'))
                .keys([uiCmd('⌘⇧' + t('info_panels.location.key'))])
                .placement('top')
            );

        locPanelLabelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                d3_event.preventDefault();
                context.ui().info.toggle('location');
            });

        locPanelLabelEnter
            .append('span')
            .text(t('background.location_panel.description'));


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
            .text(t('background.imagery_problem_faq'));

        _backgroundList
            .call(drawListItems, 'radio', chooseBackground, function(d) { return !d.isHidden() && !d.overlay; });
    }

    function setTooltips(selection) {
        selection.each(function(d, i, nodes) {
            var item = d3_select(this).select('label');
            var span = item.select('span');
            var placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            var description = d.description();
            var isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

            item.call(uiTooltip().destroyAny);

            if (d.id === previousBackgroundID()) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title('<div>' + t('background.switch') + '</div>')
                    .keys([uiCmd('⌘' + t('background.key'))])
                );
            } else if (description || isOverflowing) {
                item.call(uiTooltip()
                    .placement(placement)
                    .title(description || d.name())
                );
            }
        });
    }

    function drawListItems(layerList, type, change, filter) {
        var sources = context.background()
            .sources(context.map().extent(), context.map().zoom(), true)
            .filter(filter);

        var layerLinks = layerList.selectAll('li')
            .data(sources, function(d) { return d.name(); });

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
            .attr('name', 'layers')
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return d.name(); });

        enter.filter(function(d) { return d.id === 'custom'; })
            .append('button')
            .attr('class', 'layer-browse')
            .call(uiTooltip()
                .title(t('settings.custom_background.tooltip'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .on('click', editCustom)
            .call(svgIcon('#iD-icon-more'));

        enter.filter(function(d) { return d.best(); })
            .append('div')
            .attr('class', 'best')
            .call(uiTooltip()
                .title(t('background.best_imagery'))
                .placement((localizer.textDirection() === 'rtl') ? 'right' : 'left')
            )
            .append('span')
            .html('&#9733;');


        layerList.selectAll('li')
            .sort(sortSources);

        layerList
            .call(updateLayerSelections);


        function sortSources(a, b) {
            return a.best() && !b.best() ? -1
                : b.best() && !a.best() ? 1
                : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
        }
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
    }


    function chooseBackground(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        d3_event.preventDefault();
        var previousBackground = context.background().baseLayerSource();
        prefs('background-last-used-toggle', previousBackground.id);
        prefs('background-last-used', d.id);
        context.background().baseLayerSource(d);
        document.activeElement.blur();
    }


    function customChanged(d) {
        if (d && d.template) {
            _customSource.template(d.template);
            chooseBackground(_customSource);
        } else {
            _customSource.template('');
            chooseBackground(context.background().findSource('none'));
        }
    }


    function editCustom() {
        d3_event.preventDefault();
        context.container()
            .call(_settingsCustomBackground);
    }


    context.background()
        .on('change.background_list', function() {
            _backgroundList.call(updateLayerSelections);
        });

    context.map()
        .on('move.background_list',
            _debounce(function() {
                // layers in-view may have changed due to map move
                window.requestIdleCallback(section.reRender);
            }, 1000)
        );

    return section;
}

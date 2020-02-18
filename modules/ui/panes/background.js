import _debounce from 'lodash-es/debounce';

import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { tooltip } from '../../util/tooltip';
import { svgIcon } from '../../svg/icon';
import { uiBackgroundDisplayOptions } from '../background_display_options';
import { uiBackgroundOffset } from '../background_offset';
import { uiCmd } from '../cmd';
import { uiDisclosure } from '../disclosure';
import { uiMapInMap } from '../map_in_map';
import { uiSettingsCustomBackground } from '../settings/custom_background';
import { uiTooltipHtml } from '../tooltipHtml';
import { uiPane } from '../pane';


export function uiBackground(context) {

    var _key = t('background.key');

    var _customSource = context.background().findSource('custom');
    var _previousBackground = context.background().findSource(context.storage('background-last-used-toggle'));

    var _backgroundList = d3_select(null);
    var _overlayList = d3_select(null);
    var _displayOptionsContainer = d3_select(null);
    var _offsetContainer = d3_select(null);

    var backgroundDisplayOptions = uiBackgroundDisplayOptions(context);
    var backgroundOffset = uiBackgroundOffset(context);

    var settingsCustomBackground = uiSettingsCustomBackground(context)
        .on('change', customChanged);


    function setTooltips(selection) {
        selection.each(function(d, i, nodes) {
            var item = d3_select(this).select('label');
            var span = item.select('span');
            var placement = (i < nodes.length / 2) ? 'bottom' : 'top';
            var description = d.description();
            var isOverflowing = (span.property('clientWidth') !== span.property('scrollWidth'));

            item.call(tooltip().destroyAny);

            if (d === _previousBackground) {
                item.call(tooltip()
                    .placement(placement)
                    .html(true)
                    .title(function() {
                        var tip = '<div>' + t('background.switch') + '</div>';
                        return uiTooltipHtml(tip, uiCmd('⌘' + _key));
                    })
                );
            } else if (description || isOverflowing) {
                item.call(tooltip()
                    .placement(placement)
                    .title(description || d.name())
                );
            }
        });
    }


    function updateLayerSelections(selection) {
        function active(d) {
            return context.background().showsLayer(d);
        }

        selection.selectAll('li')
            .classed('active', active)
            .classed('switch', function(d) { return d === _previousBackground; })
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
    }


    function chooseBackground(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        d3_event.preventDefault();
        _previousBackground = context.background().baseLayerSource();
        context.storage('background-last-used-toggle', _previousBackground.id);
        context.storage('background-last-used', d.id);
        context.background().baseLayerSource(d);
        _backgroundList.call(updateLayerSelections);
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
            .call(settingsCustomBackground);
    }


    function chooseOverlay(d) {
        d3_event.preventDefault();
        context.background().toggleOverlayLayer(d);
        _overlayList.call(updateLayerSelections);
        document.activeElement.blur();
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
            .call(tooltip()
                .title(t('settings.custom_background.tooltip'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', editCustom)
            .call(svgIcon('#iD-icon-more'));

        enter.filter(function(d) { return d.best(); })
            .append('div')
            .attr('class', 'best')
            .call(tooltip()
                .title(t('background.best_imagery'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
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


    function renderBackgroundList(selection) {

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
            .call(tooltip()
                .html(true)
                .title(uiTooltipHtml(t('background.minimap.tooltip'), t('background.minimap.key')))
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
            .call(tooltip()
                .html(true)
                .title(uiTooltipHtml(t('background.panel.tooltip'), uiCmd('⌘⇧' + t('info_panels.background.key'))))
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


        // "Info / Report a Problem" link
        selection.selectAll('.imagery-faq')
            .data([0])
            .enter()
            .append('div')
            .attr('class', 'imagery-faq')
            .append('a')
            .attr('target', '_blank')
            .call(svgIcon('#iD-icon-out-link', 'inline'))
            .attr('href', 'https://github.com/openstreetmap/iD/blob/master/FAQ.md#how-can-i-report-an-issue-with-background-imagery')
            .append('span')
            .text(t('background.imagery_problem_faq'));

        updateBackgroundList();
    }


    function renderOverlayList(selection) {
        var container = selection.selectAll('.layer-overlay-list')
            .data([0]);

        _overlayList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-overlay-list')
            .attr('dir', 'auto')
            .merge(container);

        updateOverlayList();
    }

    function updateBackgroundList() {
        _backgroundList
            .call(drawListItems, 'radio', chooseBackground, function(d) { return !d.isHidden() && !d.overlay; });
    }

    function updateOverlayList() {
        _overlayList
            .call(drawListItems, 'checkbox', chooseOverlay, function(d) { return !d.isHidden() && d.overlay; });
    }


    function update() {
        if (!backgroundPane.selection().select('.disclosure-wrap-background_list').classed('hide')) {
            updateBackgroundList();
        }

        if (!backgroundPane.selection().select('.disclosure-wrap-overlay_list').classed('hide')) {
            updateOverlayList();
        }

        _displayOptionsContainer
            .call(backgroundDisplayOptions);

        _offsetContainer
            .call(backgroundOffset);
    }


    function quickSwitch() {
        if (d3_event) {
            d3_event.stopImmediatePropagation();
            d3_event.preventDefault();
        }
        if (_previousBackground) {
            chooseBackground(_previousBackground);
        }
    }


    var backgroundPane = uiPane('background', context)
        .key(_key)
        .title(t('background.title'))
        .description(t('background.description'))
        .iconName('iD-icon-layers');

    backgroundPane.renderContent = function(content) {

        // background list
        content
            .append('div')
            .attr('class', 'background-background-list-container')
            .call(uiDisclosure(context, 'background_list', true)
                .title(t('background.backgrounds'))
                .content(renderBackgroundList)
            );

        // overlay list
        content
            .append('div')
            .attr('class', 'background-overlay-list-container')
            .call(uiDisclosure(context, 'overlay_list', true)
                .title(t('background.overlays'))
                .content(renderOverlayList)
            );

        // display options
        _displayOptionsContainer = content
            .append('div')
            .attr('class', 'background-display-options');

        // offset controls
        _offsetContainer = content
            .append('div')
            .attr('class', 'background-offset');


        // add listeners
        context.map()
            .on('move.background-update',
                _debounce(function() { window.requestIdleCallback(update); }, 1000)
            );


        context.background()
            .on('change.background-update', update);


        update();

        context.keybinding()
            .on(uiCmd('⌘' + _key), quickSwitch);
    };

    return backgroundPane;
}

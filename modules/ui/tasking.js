import _debounce from 'lodash-es/debounce';

import { descending as d3_descending, ascending as d3_ascending } from 'd3-array';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg/icon';
import { uiCmd } from './cmd';
import { uiDisclosure } from './disclosure';
import { uiSettingsCustomBackground } from './settings/custom_background';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';


export function uiTasking(context) {
    var key = t('tasking.key');

    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);

    var _customSource = context.tasking().findSource('custom');
    var _previousManager = context.tasking().findSource(context.storage('manager-last-used-toggle'));

    var _managersList = d3_select(null);

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

            if (d === _previousManager) {
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
            }
        });
    }


    function updateLayerSelections(selection) {
        function active(d) {
            return context.background().showsLayer(d);
        }

        selection.selectAll('li')
            .classed('active', active)
            .classed('switch', function(d) { return d === _previousManager; })
            .call(setTooltips)
            .selectAll('input')
            .property('checked', active);
    }


    function chooseManager(d) {
        if (d.id === 'custom' && !d.template()) {
            return editCustom();
        }

        d3_event.preventDefault();
        _previousManager = context.tasking().manager();
        context.storage('manager-last-used-toggle', _previousManager.id);
        context.storage('manager-last-used', d.id);
        context.tasking().manager(d);
        _managersList.call(updateLayerSelections);
        document.activeElement.blur();
    }


    function customChanged(d) {
        if (d && d.template) {
            _customSource.template(d.template);
            chooseManager(_customSource);
        } else {
            _customSource.template('');
            chooseManager(context.background().findSource('none'));
        }
    }


    function editCustom() {
        d3_event.preventDefault();
        context.container()
            .call(settingsCustomBackground);
    }


    function drawListItems(layerList, type, change, filter) {
        var sources = context.background()
            .sources(context.map().extent())
            .filter(filter);

        var layerLinks = layerList.selectAll('li')
            .data(sources, function(d) { return d.name(); });

        layerLinks.exit()
            .remove();

        var enter = layerLinks.enter()
            .append('li')
            .classed('layer-custom', function(d) { return d.id === 'custom'; })
            .classed('best', function(d) { return d.best(); });

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


        layerList.selectAll('li')
            .sort(sortSources)
            .style('display', layerList.selectAll('li').data().length > 0 ? 'block' : 'none');

        layerList
            .call(updateLayerSelections);


        function sortSources(a, b) {
            return a.best() && !b.best() ? -1
                : b.best() && !a.best() ? 1
                : d3_descending(a.area(), b.area()) || d3_ascending(a.name(), b.name()) || 0;
        }
    }


    function renderManagersList(selection) {

        // the managers list
        var container = selection.selectAll('.layer-managers-list')
            .data([0]);

        _managersList = container.enter()
            .append('ul')
            .attr('class', 'layer-list layer-managers-list')
            .attr('dir', 'auto')
            .merge(container);

        updateManagersList();
    }


    function updateManagersList() {
        _managersList
            .call(drawListItems, 'radio', chooseManager, function(d) { return !d.isHidden() && !d.overlay; });
    }


    function update() {
        if (!_pane.select('.disclosure-wrap-managers_list').classed('hide')) {
            updateManagersList();
        }
    }


    function quickSwitch() {
        if (d3_event) {
            d3_event.stopImmediatePropagation();
            d3_event.preventDefault();
        }
        if (_previousManager) {
            chooseManager(_previousManager);
        }
    }

    var paneTooltip = tooltip()
        .placement((textDirection === 'rtl') ? 'right' : 'left')
        .html(true)
        .title(uiTooltipHtml(t('tasking.description'), key));

    uiTasking.togglePane = function() {
        if (d3_event) d3_event.preventDefault();
        paneTooltip.hide(_toggleButton);
        context.ui().togglePanes(!_pane.classed('shown') ? _pane : undefined);
    };

    function hidePane() {
        context.ui().togglePanes();
    }

    uiTasking.renderToggleButton = function(selection) {

        _toggleButton = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', uiTasking.togglePane)
            .call(svgIcon('#iD-icon-tasking', 'light'))
            .call(paneTooltip);
    };

    uiTasking.renderPane = function(selection) {

        _pane = selection
            .append('div')
            .attr('class', 'fillL map-pane tasking-pane hide')
            .attr('pane', 'tasking');


        var heading = _pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('tasking.title'));

        heading
            .append('button')
            .on('click', hidePane)
            .call(svgIcon('#iD-icon-close'));


        var content = _pane
            .append('div')
            .attr('class', 'pane-content');

        // manager list
        content
            .append('div')
            .attr('class', 'tasking-manager-list-container')
            .call(uiDisclosure(context, 'managers_list', true)
                .title(t('tasking.managers'))
                .content(renderManagersList)
            );


        // add listeners
        context.map()
            .on('move.background-update',
                _debounce(function() { window.requestIdleCallback(update); }, 1000)
            );


        context.background()
            .on('change.background-update', update);


        update();

        context.keybinding()
            .on(key, uiTasking.togglePane)
            .on(uiCmd('⌘' + key), quickSwitch);
    };

    return uiTasking;
}
import _debounce from 'lodash-es/debounce';

import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';

import { actionNoop } from '../actions/noop';
import { geoSphericalDistance } from '../geo';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from './disclosure';
import { uiSettingsTaskData } from './settings/task_data';
import { uiTooltipHtml } from './tooltipHtml';
import { utilGetSetValue, utilHighlightEntities, utilNoAuto } from '../util';


export function uiTasks(context) {
    var key = t('tasks.key');

    var layers = context.layers();

    var settingsTaskData = uiSettingsTaskData(context)
        .on('change', taskChanged);

    function taskChanged(d) {
        var tasksLayer = layers.layer('tasks');
        if (d && d.url) {
            tasksLayer.url(d.url);
        }
    }


    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);


    function addNotificationBadge(selection) {
        var d = 10;
        selection.selectAll('svg.notification-badge')
            .data([0])
            .enter()
            .append('svg')
            .attr('viewbox', '0 0 ' + d + ' ' + d)
            .attr('class', 'notification-badge hide')
            .append('circle')
            .attr('cx', d / 2)
            .attr('cy', d / 2)
            .attr('r', (d / 2) - 1)
            .attr('fill', 'currentColor');
    }


    function hidePane() {
        context.ui().togglePanes();
    }


    var paneTooltip = tooltip()
        .placement((textDirection === 'rtl') ? 'right' : 'left')
        .html(true)
        .title(uiTooltipHtml(t('tasks.title'), key));


    uiTasks.togglePane = function() {
        if (d3_event) d3_event.preventDefault();
        paneTooltip.hide(_toggleButton);
        context.ui().togglePanes(!_pane.classed('shown') ? _pane : undefined);
    };


    uiTasks.renderToggleButton = function(selection) {
        _toggleButton = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', uiTasks.togglePane)
            .call(svgIcon('#iD-icon-alert', 'light'))
            .call(addNotificationBadge)
            .call(paneTooltip);
    };

    function editTask() {
        d3_event.preventDefault();
        context.container()
            .call(settingsTaskData);
    }


    uiTasks.renderPane = function(selection) {
        _pane = selection
            .append('div')
            .attr('class', 'fillL map-pane tasks-pane hide')
            .attr('pane', 'map-tasks');

        var heading = _pane
            .append('div')
            .attr('class', 'pane-heading');

        heading
            .append('h2')
            .text(t('tasks.title'));

        heading
            .append('button')
            .on('click', hidePane)
            .call(svgIcon('#iD-icon-close'));

        var content = _pane
            .append('div')
            .attr('class', 'pane-content');

        content
            .append('button')
            .call(tooltip()
                .title(t('settings.custom_data.tooltip'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', editTask)
            .call(svgIcon('#iD-icon-more'));

        // update();

        context.keybinding()
            .on(key, uiTasks.togglePane);
    };

    return uiTasks;
}

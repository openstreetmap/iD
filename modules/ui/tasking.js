import _debounce from 'lodash-es/debounce';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from './disclosure';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';

import { uiSettingsCustomTasking } from './settings/custom_tasking';
import { uiTaskingTaskEditor } from './taskingTaskEditor';


export function uiTasking(context) {

  var taskingTaskEditor = uiTaskingTaskEditor(context);

    var key = t('tasking.key');

    var taskingService = context.tasking();

    var layer = context.layers().layer('tasking');

    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);
    var _taskingManagerContainer = d3_select(null);
    var _taskingTaskContainer = d3_select(null);

    var _task = taskingService.currTask();

    var settingsCustomTasking = uiSettingsCustomTasking(context)
        .on('change', customTaskingChanged);



    function showsLayer() {
        if (layer) {
            return layer.enabled();
        }
        return false;
    }


    function setLayer(enabled) {
        // Don't allow layer changes while drawing - #6584
        var mode = context.mode();
        if (mode && /^draw/.test(mode.id)) return;

        if (layer) {
            layer.enabled(enabled);

            update();
        }
    }


    function toggleLayer() {
        setLayer(!showsLayer());
    }


    function update() {
        _task = taskingService.currTask();

        if (!_pane.select('.disclosure-wrap-tasking_managers').classed('hide')) {
            updateTaskingManagers();
        }

        if (!_pane.select('.disclosure-wrap-tasking_task').classed('hide')) {
            updateTaskingTask();
        }
    }


    function renderTaskingManagers(selection) {
        var container = selection.selectAll('.tasking-managers-container')
            .data([0]);

        _taskingManagerContainer = container.enter()
            .append('div')
            .attr('class', 'tasking-managers-container')
            .merge(container);

        updateTaskingManagers();
    }


    function updateTaskingManagers() {
        _taskingManagerContainer
            .call(drawCustomTaskingItems);
    }


    function drawCustomTaskingItems(selection) {
        var hasData = layer && layer.hasData();
        var showsData = hasData && layer.enabled();

        var ul = selection
            .selectAll('.layer-list-tasking')
            .data(layer ? [0] : []);

        // Exit
        ul.exit()
            .remove();

        // Enter
        var ulEnter = ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-tasking');

        var liEnter = ulEnter
            .append('li')
            .attr('class', 'list-item-tasking');

        liEnter
            .append('button')
            .call(tooltip()
                .title(t('settings.custom_tasking.tooltip'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', editCustomTasking)
            .call(svgIcon('#iD-icon-more'));

        liEnter
            .append('button')
            .call(tooltip()
                .title(t('tasking.custom_tasking.zoom'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                layer.fitZoom();
            })
            .call(svgIcon('#iD-icon-search'));

        var labelEnter = liEnter
            .append('label')
            .call(tooltip()
                .title(t('tasking.custom_tasking.tooltip'))
                .placement('bottom')
            );

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() { toggleLayer(); });

        labelEnter
            .append('span')
            .text(t('tasking.custom_tasking.title'));

        // Update
        ul = ul
            .merge(ulEnter);

        ul.selectAll('.list-item-tasking')
            .classed('active', showsData)
            .selectAll('label')
            .classed('deemphasize', !hasData)
            .selectAll('input')
            .property('disabled', !hasData)
            .property('checked', showsData);
    }


    function editCustomTasking() {
        d3_event.preventDefault();
        context.container()
            .call(settingsCustomTasking);
    }


    function customTaskingChanged(settings) {

        // load custom data
        var taskingService = context.tasking();
        if (settings && settings.url) {
            taskingService.setCustom(settings);
        }

        // zoom to data
        taskingService.event.on('loadedTask', function fitZoom() {
            layer.fitZoom();
            update();
        });
    }


    function renderTaskingTask(selection) {
        var container = selection.selectAll('.tasking-task-container')
            .data([0]);

        _taskingTaskContainer = container.enter()
            .append('div')
            .attr('class', 'tasking-task-container')
            .merge(container);

            updateTaskingTask();
    }


    function updateTaskingTask() {
        _taskingTaskContainer
            .call(taskingTaskEditor.datum(_task));
    }


    function hidePane() {
        context.ui().togglePanes();
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


    uiTasking.renderToggleButton = function(selection) {

        _toggleButton = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', uiTasking.togglePane)
            .call(svgIcon('#iD-icon-tasking', 'light'))
            // .call(addNotificationBadge) // TODO: TAH - add notification when details within the pane has changed
            .call(paneTooltip);

            // TODO: change color of button when tasking is enabled
    };


    uiTasking.renderPane = function(selection) {

        _pane = selection
            .append('div')
            .attr('class', 'fillL map-pane tasking-pane hide')
            .attr('pane', 'map-tasking');


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


            // tasking
        content
            .append('div')
            .attr('class', 'map-data-tasking')
            .call(uiDisclosure(context, 'tasking_managers', false)
                .title(t('tasking.manager.name'))
                .content(renderTaskingManagers)
            );


        // task
        content
            .append('div')
            .attr('class', 'tasking-task-container')
            .call(uiDisclosure(context, 'tasking_task', true)
                .title(t('tasking.task.name'))
                .content(renderTaskingTask)
            );


        context.keybinding()
            .on(key, uiTasking.togglePane);
    };

    return uiTasking;
}
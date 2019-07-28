import _debounce from 'lodash-es/debounce';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { modeSave } from '../modes';
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

    var _taskingContainer = d3_select(null);
    var _taskingManagerContainer = d3_select(null);
    var _taskingTaskContainer = d3_select(null);
    var _taskingErrorsContainer = d3_select(null);

    var _errors = taskingService.errors();

    var _task = taskingService.currentTask();
    var _project = taskingService.currentProject();

    // listeners
    var settingsCustomTasking = uiSettingsCustomTasking(context)
        .on('change', customTaskingChanged);

    taskingService.event.on('setManager', function fitZoom() {
        update();
    });

    taskingService.event.on('setTask', function fitZoom() {
        layer.fitZoom();
        update();
    });

    context.validator().on('validated', function() { updateOnChange(); });
    context.history().on('change', function() { updateOnChange(); });

    function updateOnChange() {

        function iterateErrors(errors, _id, _property, _value) {
            for (var error in _errors) {
                if (errors[error].id === _id) {
                    errors[error][_property] = _value;
                   break;
                }
            }
            return errors;
        }
        if (context.history().hasChanges() && layer.enabled() === false) {
            _errors = iterateErrors(_errors, 'unsavedEdits', 'active', true);
        } else {
            _errors = iterateErrors(_errors, 'unsavedEdits', 'active', false);
        }

        taskingService.errors(_errors);
        update();
    }


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

    function activeErrors(errors) {
        var activeErrors = errors.filter(function(error) { return error.active; });

        return activeErrors.length ? activeErrors : [];
    }

    function isSaving() {
        var mode = context.mode();
        return mode && mode.id === 'save';
    }


    function save() {
        d3_event.preventDefault();
        if (!context.inIntro() && !isSaving() && context.history().hasChanges() && !showsLayer() && !taskingService.edits()) {
            context.enter(modeSave(context));
        }
    }


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
        }
    }


    function setManager(d) {

        function layerSupported() {
            return layer && layer.supported();
        }

        taskingService.currentManager(d); // set manager

        if (d.managerId === 'none') {
            taskingService.resetProjectAndTask();
            setLayer(false);

        } else if (context.history().hasChanges()) {
            taskingService.resetProjectAndTask();
            setLayer(false);

        } else {

            // check if layer is supported
            if (!layerSupported() || d.managerId !== 'custom') return;

            // handle custom manager
            if (d.managerId === 'custom') {

                // get project and task from custom settings
                _project = taskingService.getProject(taskingService.customSettings().projectId);
                _task = taskingService.getTask(taskingService.customSettings().taskId);

                // set project & task
                if (_project && _task) {
                    taskingService.currentProject(_project);
                    taskingService.currentTask(_task);
                }
            }

            setLayer(true); // enable layer

        }
    }

    function showsManager(d) {
        return taskingService.currentManager() && taskingService.currentManager().managerId === d.managerId;
    }


    function update() {
        updateTaskingErrors();

        var errors = activeErrors(_errors);

        _toggleButton.selectAll('.notification-badge')
            .classed('error', (errors.length > 0))
            .classed('hide', (errors.length === 0));

        if (!_pane.select('.disclosure-wrap-tasking_managers').classed('hide')) {
            updateTaskingManagers();
        }

        if (!_pane.select('.disclosure-wrap-tasking_task').classed('hide')) {
            updateTaskingTask();
        }

        // if (context.history().hasChanges()) {
        //     _taskingErrorsContainer
        //         .call(drawErrorsList, _errors);

        //     // remove tasking
        //     _taskingManagerContainer.remove();
        //     _taskingTaskContainer.remove();

        // } else {
        //     if (!_pane.select('.disclosure-wrap-tasking_managers').classed('hide')) {
        //         updateTaskingManagers();
        //     }

        //     if (!_pane.select('.disclosure-wrap-tasking_task').classed('hide')) {
        //         updateTaskingTask();
        //     }
        // }
    }


    function renderTaskingErrors(selection) {
        _taskingErrorsContainer = selection
            .call(drawErrorsList, _errors);

    }

    function updateTaskingErrors() {
        _errors = taskingService.errors(); // get current errors

        _taskingErrorsContainer
            .call(drawErrorsList, _errors);
    }

    function drawErrorsList(selection, errors) {
        var list = selection.selectAll('.tasking-errors-list')
            .data([0]);

        // Exit
        list.exit()
            .remove();

        // Enter
        list.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-tasking tasking-errors-list errors-list')
            .merge(list);

        var items = list.selectAll('li')
            .data(activeErrors(errors), function(d) {
                return d.id;
            });

        // Exit
        items.exit()
            .remove();

        // Enter
        var itemsEnter = items.enter()
            .append('li')
            .attr('class', function (d) { return 'issue severity-' + d.severity; })
            .on('click', function(d) {
                if (d.id === 'unsavedEdits') { save(); }
            });


        var labelsEnter = itemsEnter
            .append('div')
            .attr('class', 'issue-label');

        var textEnter = labelsEnter
            .append('span')
            .attr('class', 'issue-text');

        textEnter
            .append('span')
            .attr('class', 'issue-icon')
            .each(function(d) {
                var iconName = '#iD-icon-' + (d.severity === 'warning' ? 'alert' : 'error');
                d3_select(this)
                    .call(svgIcon(iconName));
            });

        textEnter
            .append('span')
            .attr('class', 'tasking-error-message issue-message');

        // Update
        items = items
            .merge(itemsEnter);

        items.selectAll('.tasking-error-message')
            .text(function(d) {
                return d.message;
            });
    }


    function renderTaskingManagers(selection) {
        var container = selection.selectAll('.tasking-managers-container')
            .data([0]);

        _taskingManagerContainer = container.enter()
            .append('div')
            .attr('class', 'tasking-managers-container');


        var ul = _taskingManagerContainer
            .selectAll('.layer-list-tasking')
            .data(layer ? [0] : []);

        // Exit
        ul.exit()
            .remove();

        // Enter
        ul.enter()
            .append('ul')
            .attr('class', 'layer-list layer-list-tasking');

        _taskingManagerContainer
            .merge(container);

        updateTaskingManagers();
    }


    function updateTaskingManagers() {
        _taskingManagerContainer.selectAll('.layer-list-tasking')
            .call(drawListItems, taskingService.managers(), 'radio', 'manager', setManager, showsManager);

        // _taskingManagerContainer
        //     .call(drawManagerItems);
    }


    function drawListItems(selection, data, type, name, change, active) {

        var items = selection.selectAll('li')
            .data(data);

        // Exit
        items.exit()
            .remove();

        // Enter
        var enter = items.enter()
            .append('li')
            .attr('class', function(d) { return 'manager-' + d.managerId; })
            .call(tooltip()
                .title(function(d) {
                    return !activeErrors(_errors).length ?
                        t('tasking.manager.managers.' + d.managerId + '.tooltip') :
                        t('tasking.manager.managers.errors.tooltip');
                })
                .placement('bottom')
            );

        var customManager = enter.filter(function(d) { return d.managerId === 'custom'; });

        customManager
            .append('button')
            .attr('class', 'custom-manager-browse')
            .on('click', editCustomTasking)
            .call(svgIcon('#iD-icon-more'));

        customManager
            .append('button')
            .attr('class', 'custom-manager-zoom')
            .call(tooltip()
                .title(t('tasking.manager.managers.custom.zoom'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                layer.fitZoom();
            })
            .call(svgIcon('#iD-icon-search'));

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return d.name; });

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active)
            .property('disabled', !!activeErrors(_errors).length);

        items
            .selectAll('label')
            .classed('deemphasize', !!activeErrors(_errors).length);

        // Update
        items = items
            .merge(enter);


        // deemphasize & disable custom label & zoom when no data loaded
        function hasData() {

            var settings = taskingService.customSettings();
            var hasLoadedCustom = !!taskingService.getTask(settings.taskId);

            var data = layer && layer.hasData();

            return hasLoadedCustom || data;
        }

        var showsData = hasData && layer.enabled();

        selection.selectAll('.manager-custom')
            .selectAll('label')
            .classed('deemphasize', !hasData())
            .selectAll('input')
            .property('disabled', !hasData() && !!activeErrors(_errors).length)
            .property('checked', showsData);

        selection.selectAll('.custom-manager-zoom')
            .classed('deemphasize', !hasData() && !!activeErrors(_errors).length)
            .property('disabled', !hasData() && !!activeErrors(_errors).length)
            .property('checked', showsData);
    }


    function editCustomTasking() {
        d3_event.preventDefault();
        context.container()
            .call(settingsCustomTasking);
    }


    function customTaskingChanged(settings) {

        if (settings && settings.url) {

            // set custom settings
            taskingService.customSettings(settings);

            // load data
            taskingService.loadFromUrl(taskingService.customSettings()); // TODO: TAH - pull out when other managers added

            // set manager
            setManager(taskingService.getManager('custom'));
        }
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
        _task = taskingService.currentTask(); // get current task

        _taskingTaskContainer
            .call(taskingTaskEditor.datum(
                function(){ return showsLayer() ? _task : undefined; }()
            ));
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

    uiTasking.showPane = function() {
        if (d3_event) d3_event.preventDefault();
        paneTooltip.hide(_toggleButton);
        context.ui().togglePanes(_pane);
    };


    uiTasking.renderToggleButton = function(selection) {

        _toggleButton = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', uiTasking.togglePane)
            .call(svgIcon('#iD-icon-tasking', 'light'))
            .call(addNotificationBadge)
            .call(paneTooltip);

            // TODO: TAH - change color of button when tasking is enabled
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

        _taskingContainer = content.enter()
            .append('div')
            .attr('class', 'tasking-container')
            .merge(content);

        // errors
        _taskingContainer
                 .append('div')
                 .attr('class', 'tasking-errors-container')
                 .call(renderTaskingErrors);

        // tasking
        _taskingContainer
            .append('div')
            .attr('class', 'tasking-manager-container')
            .call(uiDisclosure(context, 'tasking_managers', false)
                .title(t('tasking.manager.name'))
                .content(renderTaskingManagers)
            );


        // task
        _taskingContainer
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
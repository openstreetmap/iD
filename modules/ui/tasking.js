import _debounce from 'lodash-es/debounce';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { modeSave, modeBrowse } from '../modes';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from './disclosure';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';

import { uiSettingsCustomTasking } from './settings/custom_tasking';
import { uiTaskingProjectEditor } from './taskingProjectEditor';
import { uiTaskingTaskEditor } from './taskingTaskEditor';


export function uiTasking(context) {

    var taskingProjectEditor = uiTaskingProjectEditor(context);
    var taskingTaskEditor = uiTaskingTaskEditor(context);

    var key = t('tasking.key');

    var tasking = context.tasking();

    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);

    var _taskingContainer = d3_select(null);

    var _taskingErrorsContainer = d3_select(null);
    var _taskingWelcomeContainer = d3_select(null);
    var _taskingManagerContainer = d3_select(null);
    var _taskingProjectContainer = d3_select(null);
    var _taskingTaskContainer = d3_select(null);

    var _errors = tasking.errors();

    var _hot_tm_url = 'https://tasks.hotosm.org';

    // listeners
    var settingsCustomTasking = uiSettingsCustomTasking(context)
        .on('change', customTaskingChanged);

    context.history().on('change', function() {
        updateActiveErrors();
    });

    tasking.on('setTask.taskingPane', function() {
        update();
    });


    tasking.on('cancelTasking', function() {
        // reset edits
        context.history().reset();

        // set mode to browse
        context.enter(modeBrowse(context));

        update();
    });


    tasking.on('loadedProject', function(project) {
        updateActiveErrors();

        if (!activeErrors(_errors).length) {
            // set project
            tasking.activeProject(project.id());
        }
    });

    tasking.on('loadedTask', function(task) {
        updateActiveErrors();

        setTask(task);
    });

    function setTask(task) {

        // enable layer if no active errors
        if (!activeErrors(_errors).length) {

            // attempt to lock task
            tasking.lockTaskForMapping(task)
                .then(function(lockResponse) {
                    updateActiveErrors();

                    if (lockResponse && Object.keys(lockResponse).length) {

                        update();
                    }
                })
                .catch(function(err) { console.log('locking task attempt error: ', err); });

        }

        update();
    }


    function updateActiveErrors() {

        // reset active errors
    //    tasking.resetActiveErrors();
       _errors = tasking.errors();

        // unsaved edits
        _errors.unsavedEdits.active = context.history().hasChanges();

        // push updates to errors
        _errors = tasking.errors(_errors);
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
        var _activeErrors = [];

        for (var error in errors) {
            if (errors[error].active) { _activeErrors.push(errors[error]); }
        }

        return _activeErrors;
    }

    function isSaving() {
        var mode = context.mode();
        return mode && mode.id === 'save';
    }


    function save() {
        d3_event.preventDefault();
        if (!context.inIntro() && !isSaving() && context.history().hasChanges() && !tasking.edits()) {
            context.enter(modeSave(context));
        }
    }

    function update() {

        updateTaskingErrors();
        updateTaskingWelcome();

        var errors = activeErrors(_errors);

        _toggleButton.selectAll('.notification-badge')
            .classed('error', (errors.length > 0))
            .classed('hide', (errors.length === 0));

        // update disclosures
        if (!_pane.select('.disclosure-wrap-tasking_task').classed('hide')) {
            updateTaskingTask();
        }

        if (!_pane.select('.disclosure-wrap-tasking_project').classed('hide')) {
            updateTaskingProject();
        }

        if (!_pane.select('.disclosure-wrap-tasking_managers').classed('hide')) {
            updateTaskingManagers();
        }
    }

    function renderTaskingErrors(selection) {
        _taskingErrorsContainer = selection
            .call(drawErrorsList, _errors);

    }

    function updateTaskingErrors() {
        _errors = tasking.errors(); // get current errors

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
                .attr('class', 'layer-list layer-list-tasking tasking-errors-list issues-list errors-list')
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
                return d.message(d.task);
            });
    }


    function renderTaskingWelcome(selection) {
        var container = selection.selectAll('tasking-welcome-container')
            .data([0]);

        _taskingWelcomeContainer = container.enter()
            .append('div')
                .attr('class', 'tasking-welcome-container')
                .merge(container);

            updateTaskingWelcome();
    }


    function updateTaskingWelcome() {
        var welcome = _taskingWelcomeContainer.selectAll('.tasking-welcome')
            .data(tasking.activeTask() ? [] : [0]);

        welcome.exit()
            .remove();

        var welcomeEnter = welcome.enter()
            .append('div')
                .attr('class', 'tasking-welcome');

        welcomeEnter
            .append('h3')
                .attr('class', 'tasking-welcome-header')
                .text(t('tasking.welcome.header'));

        var welcomeSuggestion = welcomeEnter
            .append('p')
                .attr('class', 'tasking-welcome-suggestion')
                .text(t('tasking.welcome.suggestion'));


        var taskingManagerLink = d3_select(document.createElement('div'));

        taskingManagerLink
            .append('a')
            .attr('class', 'tasking_manager-welcome-link')
            .text(t('tasking.welcome.manager'))
            .attr('href', _hot_tm_url)
            .attr('tabindex', -1)
            .attr('target', '_blank');

        welcomeSuggestion
            .html(function() {
                return t('tasking.welcome.suggestion_with_link', { tasking_manager: taskingManagerLink.html() })
                + t('tasking.welcome.redirect');
            });

        welcome = welcomeEnter.merge(welcome);
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
            .call(taskingTaskEditor.task(tasking.activeTask()));
    }


    function renderTaskingProject(selection) {
        var container = selection.selectAll('.tasking-project-container')
            .data([0]);

        _taskingProjectContainer = container.enter()
            .append('div')
                .attr('class', 'tasking-project-container')
                .merge(container);

            updateTaskingProject();
    }


    function updateTaskingProject() {
        _taskingProjectContainer
            .call(taskingProjectEditor.project(tasking.activeProject()));
    }


    function renderTaskingManagers(selection) {

        var container = selection.selectAll('.tasking-managers-container')
            .data([0]);

        _taskingManagerContainer = container.enter()
            .append('div')
                .attr('class', 'tasking-managers-container');


        var ul = _taskingManagerContainer
            .selectAll('.layer-list-tasking')
            .data([0]);

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
        _taskingManagerContainer
            // .call(drawCustomManagerListItem, _managers, 'radio', 'manager', clickManager, showsManager);
            .call(drawCustomManagerListItem);
    }


    function drawCustomManagerListItem(selection) {
        var hasData = false;
        var showsData = false;

        var ul = selection.selectAll('.layer-list-tasking');

        var items = ul.selectAll('li')
            .data([0]);

        // Exit
        items.exit()
            .remove();

        var liEnter = items.enter()
            .append('li')
            .attr('class', 'list-item-tasking manager-custom');

        var labelEnter = liEnter
            .append('label')
            .call(tooltip()
                .title(t('tasking.manager.managers.custom.tooltip'))
                .placement('top')
            );

        labelEnter
            .append('input')
            .attr('type', 'checkbox')
            .on('change', function() {
                //toggleLayer();
            });

        labelEnter
            .append('span')
            .text(t('tasking.manager.managers.custom.title'));

        liEnter
            .append('button')
            .attr('class', 'tasking-custom-settings')
            .call(tooltip()
                .title(t('tasking.manager.managers.custom.settings.tooltip'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', editCustomTasking)
            .call(svgIcon('#iD-icon-more'));

        liEnter
            .append('button')
            .attr('class', 'tasking-custom-zoom')
            .call(tooltip()
                .title(t('tasking.manager.managers.custom.zoom'))
                .placement((textDirection === 'rtl') ? 'right' : 'left')
            )
            .on('click', function() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                //layer.fitZoom();
            })
            .call(svgIcon('#iD-icon-search'));

        // Update
        items = items
            .merge(liEnter);

        // set as active if has and shows data
        items
            .classed('active', showsData)
            .selectAll('label')
            .classed('deemphasize', !hasData)
            .selectAll('input')
            .property('disabled', !hasData) // TODO: TAH - disable if tasking has started & edits have been made
            .property('checked', showsData);

        // disable zoom if no data
        items.selectAll('.tasking-custom-zoom')
            .classed('deemphasize', !hasData)
            .property('disabled', !hasData);
    }


    function editCustomTasking() {
        d3_event.preventDefault();
        context.container()
            .call(settingsCustomTasking);
    }


    function customTaskingChanged(settings) {

        if (settings && settings.url) {

            // if settings have changed
            if (tasking.customSettings().url !== settings.url) {
                // set custom settings
                tasking.customSettings(settings);
            }
        }
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


        // welcome
        _taskingContainer
            .call(renderTaskingWelcome);


        // task
        _taskingContainer
            .append('div')
                .attr('class', 'tasking-task-toggle')
                .call(uiDisclosure(context, 'tasking_task', true)
                    .title(t('tasking.task.name'))
                    .content(renderTaskingTask)
                );


        // project
        _taskingContainer
            .append('div')
                .attr('class', 'tasking-project-toggle')
                .call(uiDisclosure(context, 'tasking_project', false)
                    .title(t('tasking.project.name'))
                    .content(renderTaskingProject)
                );


        // managers
        _taskingContainer
            .append('div')
                .attr('class', 'tasking-manager-toggle')
                .call(uiDisclosure(context, 'tasking_managers', false)
                    .title(t('tasking.manager.name'))
                    .content(renderTaskingManagers)
                );


        context.keybinding()
            .on(key, uiTasking.togglePane);
    };

    return uiTasking;
}

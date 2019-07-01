import _debounce from 'lodash-es/debounce';
import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from './disclosure';
import { uiSettingsCustomTasking } from './settings/custom_tasking';
import { uiTooltipHtml } from './tooltipHtml';
import { tooltip } from '../util/tooltip';

export function uiTasking(context) {
    var key = t('tasking.key');

    var tasking = context.tasking();
    var taskingLayer = context.layers().layer('tasking');

    var _pane = d3_select(null);
    var _toggleButton = d3_select(null);
    var _managersList = d3_select(null);
    var _projectSelection = d3_select(null);
    var _taskSelection = d3_select(null);

    var _manager = tasking.currentManager();
    var _project = tasking.currentProject();
    var _task = tasking.currentTask();

    var _customSource = tasking.getManager('custom');
    var _noneSource = tasking.getManager('none');

    var _previousManager = tasking.getManager('none');

    var taskingCustomData = uiSettingsCustomTasking(context)
        .on('change', customChanged);


    function setManager(d) {
        // handle custom manager from url
        if (d.id === 'custom' && !d.template()) {
            editCustom();
        }

        d3_event.preventDefault();
        _previousManager = tasking.currentManager(); // get previous manager
        tasking.currentManager(d); // set new manager
        _manager = tasking.currentManager(); // get current manager

        // TODO: TAH - potentially move to `editCustom logic`
        // load data using custom manager
        if (tasking.currentManager().id === 'custom' && tasking.currentManager().template()) {
            // set svg url to template
            tasking.loadFromURL(tasking.currentManager().template());

        }

        if (d.id === 'none') {
            tasking.resetProjectAndTask();
            taskingLayer.enabled(false);
        } else {
            taskingLayer.enabled(true);
        }

        document.activeElement.blur();
        update();
    }


    function showsManager(d) {
        return _manager.id === d.id;
    }


    function customChanged(d) {
        if (d && d.template) {
            _customSource.template(d.template);
            setManager(_customSource);
        } else {
            _customSource.template('');
            setManager(_noneSource);
            tasking.resetProjectAndTask();
        }
    }


    function editCustom() {
        d3_event.preventDefault();
        context.container()
            .call(taskingCustomData);
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
            .attr('class', function(d) { return 'manager-' + d.id; })
            .call(tooltip()
                .title(function(d) {
                    return t('tasking.managers.' + d.id + '.tooltip') || null;
                })
                .placement('bottom')
            );

        enter.filter(function(d) { return d.id === 'custom'; })
            .append('button')
            .attr('class', 'manager-browse')
            .on('click', editCustom)
            .call(svgIcon('#iD-icon-more'));

        var label = enter
            .append('label');

        label
            .append('input')
            .attr('type', type)
            .attr('name', name)
            .on('change', change);

        label
            .append('span')
            .text(function(d) { return d.name(); });


        // Update
        items = items
            .merge(enter);

        items
            .classed('active', active)
            .selectAll('input')
            .property('checked', active);
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
            .call(drawListItems, tasking.managers(), 'radio', 'manager', setManager, showsManager);
    }


    function renderProject(selection) {
        _projectSelection = selection
            .call(drawProjectDetails);
    }

    function drawProjectDetails(selection) {

        // the project
        var container = selection.selectAll('.project-details')
            .data([0]);

        // Exit
        container.exit()
            .remove();

        var containerEnter = container
            .enter()
            .append('div')
                .attr('class', 'project-details');

        if (!_project) {
            containerEnter
                .append('div')
                    .attr('class', 'no-project')
                    .text(t('tasking.project.no_project.message'));
        } else {
            containerEnter
                .append('div')
                    .attr('class', 'project-id')
                    .text(t('tasking.project.id') + ': ' + _project.projectId);

            // containerEnter
            //     .append('div')
            //         .attr('class', 'project-details project-name')
            //         .text(t('tasking.project.name') + ': ' + _project.projectId);
        }

        // container = container
        //     .merge(containerEnter);
    }


    function renderTask(selection) {
        _taskSelection = selection
            .call(drawTaskDetails);
    }


    function drawTaskDetails(selection) {

        // the project
        var container = selection.selectAll('.task-details')
            .data([0]);

        // Exit
        container.exit()
            .remove();

        var containerEnter = container.enter()
            .append('div')
                .attr('class', 'task-details');

        if (!_project) {
            containerEnter
                .append('div')
                    .attr('class', 'task-details no-task')
                    .text(t('tasking.task.no_task.message'));
        } else {
            containerEnter
                .append('div')
                    .attr('class', 'task-details task-id')
                    .text(t('tasking.task.id') + ': ' + _task.taskId);

            // containerEnter
            //     .append('div')
            //         .attr('class', 'task-details task-name')
            //         .text(t('tasking.task.name') + ': ' + _task.projectId);
        }

        container = container
            .merge(containerEnter);
    }


    function update() {
        if (!_pane.select('.disclosure-wrap-managers_list').classed('hide')) {
            updateManagersList();
        }

        _project = tasking.currentProject();
        _task = tasking.currentTask();

        _projectSelection
            .call(drawProjectDetails);

        // _pane.selectAll('.project-id')
        //     .text(function(){
        //         return tasking.currentProject().id !== 'none' ?
        //         t('tasking.project.id') + ' ' + tasking.currentProject().projectId :
        //         t('tasking.project.no_project.message');
        //     });
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
                .title(t('tasking.managers.name'))
                .content(renderManagersList)
            );

        // project
        content
            .append('div')
            .attr('class', 'tasking-project-container')
            .call(uiDisclosure(context, 'tasking_project', true)
                .title(t('tasking.project.name'))
                .content(renderProject)
            );

        // project
        content
            .append('div')
            .attr('class', 'tasking-task-container')
            .call(uiDisclosure(context, 'tasking_task', true)
                .title(t('tasking.task.name'))
                .content(renderTask)
            );


            // TODO: TAH - fix custom button. When clicking on button, set manager to details saved in modal. Then fix custom flow & incorrect ID showing. Then fix appending! GAH

        context.keybinding()
            .on(key, uiTasking.togglePane);
    };

    return uiTasking;
}
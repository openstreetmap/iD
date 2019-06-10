import _debounce from 'lodash-es/debounce';

import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../util/locale';
import { tooltip } from '../util/tooltip';

import { actionNoop } from '../actions/noop';
import { geoSphericalDistance } from '../geo';
import { svgIcon } from '../svg/icon';
import { uiDisclosure } from './disclosure';
import { uiTaskData } from './tasking/task_data';
import { uiTooltipHtml } from './tooltipHtml';
import { utilGetSetValue, utilHighlightEntities, utilNoAuto } from '../util';
import { uiTaskingProject } from './tasking/';

export function uiTaskingEditor(context) {
    var taskingProject = uiTaskingProject();

    var key = t('tasks.key');

    var layers = context.layers();

    var _project;
    var _task;

    var _projectSelection = d3_select(null);
    var _taskSelection = d3_select(null);

    var taskData = uiTaskData(context)
        .on('change', taskChanged);

    function taskChanged(d) {
        var taskingLayer = layers.layer('tasking');
        if (d && d.url) {
            taskingLayer.url(d.url);
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


        uiTaskingEditor.togglePane = function() {
        if (d3_event) d3_event.preventDefault();
        paneTooltip.hide(_toggleButton);
        context.ui().togglePanes(!_pane.classed('shown') ? _pane : undefined);
    };


    uiTaskingEditor.renderToggleButton = function(selection) {
        _toggleButton = selection
            .append('button')
            .attr('tabindex', -1)
            .on('click', uiTaskingEditor.togglePane)
            .call(svgIcon('#iD-icon-alert', 'light'))
            .call(addNotificationBadge)
            .call(paneTooltip);
    };

    function editTask() {
        d3_event.preventDefault();
        context.container()
            .call(taskData);
    }

    function renderProject(selection) {
        _projectSelection = selection
            .call(taskingProject.project(_project));
    }

    function renderTask(selection) {
        // _projectSelection = selection
        //     .call(taskingTask.task(_task));
    }


    uiTaskingEditor.renderPane = function(selection) {
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

        content
            .append('div')
            .attr('class', 'tasking-project')
            .call(uiDisclosure(context, 'project', true)
                .title(t('tasking.project'))
                .content(renderProject)
        );

        content
            .append('div')
            .attr('class', 'tasking-task')
            .call(uiDisclosure(context, 'task', true)
                .title(t('tasking.task'))
                .content(renderTask)
        );

        // update();

        context.keybinding()
            .on(key, uiTaskingEditor.togglePane);
    };

    uiTaskingEditor.project = function(val) {
        if (!arguments.length) return _project;
        _project = val;
        return uiTaskingEditor;
    };

    uiTaskingEditor.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;

        // set project as well
        this.project(val.projectId);

        return uiTaskingEditor;
    };


    return uiTaskingEditor;
}

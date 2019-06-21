import _debounce from 'lodash-es/debounce';

import { event as d3_event, select as d3_select } from 'd3-selection';

import { t, textDirection } from '../../util/locale';
import { tooltip } from '../../util/tooltip';

import { actionNoop } from '../../actions/noop';
import { geoSphericalDistance } from '../../geo';
import { modeBrowse } from '../../modes/browse';
import { svgIcon } from '../../svg/icon';
import { uiDisclosure } from '../disclosure';
import { uiTaskData } from './task_data';
import { uiTaskingProject } from './tasking_project';
import { uiTaskingTask } from './tasking_task';
import { uiTooltipHtml } from '../tooltipHtml';
import { utilGetSetValue, utilHighlightEntities, utilNoAuto } from '../../util';

export function uiTasking(context) {
    var taskingProject = uiTaskingProject();
    var taskingTask = uiTaskingTask();

    var key = t('tasks.key');

    var layers = context.layers();
    var taskingLayer = layers.layer('tasking');

    var _options = {
        enabled: context.tasking.enabled || 'disabled'
    };

    var _project;
    var _task;

    var _projectSelection = d3_select(null);
    var _taskSelection = d3_select(null);

    var taskData = uiTaskData(context)
        .on('change', taskChanged);

    function taskChanged(d) {
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
            .call(svgIcon('#iD-icon-alert', 'light'))
            .call(addNotificationBadge)
            .call(paneTooltip);
    };

    function editTask() {
        d3_event.preventDefault();
        context.container()
            .call(taskData);
    }

    function showsLayer(which) {
        var layer = layers.layer(which);
        if (layer) {
            return layer.enabled();
        }
        return false;
    }


    function setLayer(which, enabled) {
        var layer = layers.layer(which);
        if (layer) {
            layer.enabled(enabled);

            if (!enabled && (which === 'osm' || which === 'notes')) {
                context.enter(modeBrowse(context));
            }

            update();
        }
    }


    function update() {

    }


    function toggleLayer(which) {
        setLayer(which, !showsLayer(which));
    }

    function renderProject(selection) { // TODO: TAH - possibly remove since redundant with next function
        var container = selection.selectAll('.project-container')
            .data(
                (_project ? [_project] : []),
                function(d) { return d.id; }
            );

        container.exit()
            .remove();

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'project-container');

        containerEnter
            .append('ul')
            .attr('class', 'layer-list issue-rules-list');


        container = container
            .merge(containerEnter);


    }

    function renderTaskingOptions(selection) {
        var container = selection.selectAll('.tasking-options-container')
            .data([0]);

        container = container.enter()
            .append('div')
            .attr('class', 'tasking-options-container')
            .merge(container);

        var data = [
            { key: 'enabled', values: ['enabled', 'disabled'] },
        ];

        var options = container.selectAll('.tasking-option')
            .data(data, function(d) { return d.key; });

        var optionsEnter = options.enter()
            .append('div')
            .attr('class', function(d) { return 'tasking-option tasking-option-' + d.key; });

        optionsEnter
            .append('div')
            .attr('class', 'tasking-option-title')
            .text(function(d) { return t('tasking.options.' + d.key + '.title'); });

        var valuesEnter = optionsEnter.selectAll('label')
            .data(function(d) {
                return d.values.map(function(val) { return { value: val, key: d.key }; });
            })
            .enter()
            .append('label');

        valuesEnter
            .append('input')
            .attr('type', 'radio')
            .attr('name', function(d) { return 'taking-option-' + d.key; })
            .attr('value', function(d) { return d.value; })
            .property('checked', function(d) { return _options[d.key] === d.value; })
            .on('change', function() { toggleLayer('tasking'); });

        valuesEnter
            .append('span')
            .text(function(d) { return t('tasking.options.' + d.key + '.' + d.value); });
    }

    function renderProjectDetails(selection) {
        var container = selection.selectAll('.project-details-container')
            .data([_project]);

        var containerEnter = container.enter()
            .append('div')
            .attr('class', 'project-details-container comments-container');

        containerEnter
            .append('div')
            .attr('class', 'project-id comment')
            .text(function(d) {
                return t('tasking.projectID') + ': ' + d.projectId ? d.projectId : t('tasking.noProject');
            });
    }

    function renderTaskDetails(selection) {
        // TODO: implement
    }


    uiTasking.renderPane = function(selection) {
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
            .append('div')
            .attr('class', 'tasking-options')
            .call(renderTaskingOptions);

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
                .content(renderProjectDetails)
        );

        content
            .append('div')
            .attr('class', 'tasking-task')
            .call(uiDisclosure(context, 'task', true)
                .title(t('tasking.task'))
                .content(renderTaskDetails)
        );

        update();

        context.keybinding()
            .on(key, uiTasking.togglePane);
    };

    uiTasking.project = function(val) {
        if (!arguments.length) return _project;
        _project = val;
        return uiTasking;
    };

    uiTasking.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;

        // set project as well
        this.project(val.projectId);

        return uiTasking;
    };


    return uiTasking;
}

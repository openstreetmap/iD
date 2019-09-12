import { event as d3_event } from 'd3-selection';
// import { uiQuickLinks } from './quick_links';

import { uiTaskOverview } from './taskingTaskOverview';
import { uiTaskHistory } from './taskingTaskHistory';
import { uiTaskInstructions } from './taskingTaskInstructions';

import { t } from '../util/locale';

export function uiTaskingTaskDetails(context) {

    // var quickLinks = uiQuickLinks();
    var taskHistory = uiTaskHistory();
    var taskInstructions = uiTaskInstructions();
    var taskOverview = uiTaskOverview(context);

    var _task;
    var _activeTab = 0;

    var taskingTabs = [{'tab': 'overview'}, { 'tab': 'instructions'}, { 'tab': 'history'}];


    function taskTabs(selection) {

        var wrapper = selection
            .selectAll('.wrapper')
            .data([0]);

        var wrapperEnter = wrapper
            .enter()
            .append('div')
            .attr('class', 'wrapper tasking-tabs');

        var tabsBar = wrapperEnter
            .append('div')
            .attr('class', 'tabs-bar');

        var sectionsList = wrapperEnter
            .append('div')
            .attr('class', 'sections-list');

        wrapper = wrapper.merge(wrapperEnter);

        var tabs = tabsBar
            .selectAll('.tab')
            .data(taskingTabs);

        var tabsEnter = tabs
            .enter()
            .append('div')
            .attr('class', 'tab')
            .on('click', function (d, i) {
                _activeTab = i;
                taskTabs(selection);
            });

        tabsEnter
            .append('span')
            .text(function (d) { return t('tasking.task.tabs.' + d.tab + '.title'); });

        tabs = tabs
            .merge(tabsEnter);


        var sections = sectionsList
            .selectAll('.section-tab')
            .data(taskingTabs);

        var sectionsEnter = sections
            .enter()
            .append('div')
            .attr('class', function(d) { return 'section-tab section-tab-' + d.tab; });

        sections = sections
            .merge(sectionsEnter);

        // add overview tab
        sectionsList.selectAll('.section-tab-overview').call(taskOverview.task(_task));

        // add instructions tab
        sectionsList.selectAll('.section-tab-instructions').call(taskInstructions.task(_task));

        // add history tab
        sectionsList.selectAll('.section-tab-history').call(taskHistory.task(_task));

        // Update
        wrapper.selectAll('.tab')
            .classed('active', function (d, i) {
                return i === _activeTab;
            });

        wrapper.selectAll('.section-tab')
            .style('display', function (d, i) {
                return i === _activeTab ? 'flex' : 'none';
            });
    }


    function taskingTaskDetails(selection) {
        // quick links
        var choices = [{
            id: 'zoom_to',
            label: 'inspector.zoom_to.title',
            click: function zoomTo() {
                d3_event.preventDefault();
                d3_event.stopPropagation();
                context.layers().layer('tasking').fitZoom();
            }
        }];


        var details = selection.selectAll('.task-details')
            .data(_task ? [_task] : [], function(d) { return d.uid(); });

        // exit
        details.exit()
            .remove();

        // enter
        var detailsEnter = details.enter()
            .append('div')
            .attr('class', 'task-details');

        detailsEnter
            .append('div')
            .attr('class', 'task-status');


        details = detailsEnter
            .merge(details);

        details
            // .call(quickLinks.choices(choices))
            .call(taskTabs);

        details.select('.task-status')
            .text(function(d) {
                return t('tasking.task.status', { status:
                    function() {
                        var status = 'tasking.task.statuses.' + d.status;
                        return t(status);
                    }()
                });
            });
    }


    taskingTaskDetails.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;

        return this;
    };


    return taskingTaskDetails;
}

import { uiProjectDescription } from './taskingProjectDescription';
import { uiProjectInformation } from './taskingProjectInformation';

import { t } from '../util/locale';

export function uiTaskingProjectDetails() {
    var projectInformation = uiProjectInformation();
    var projectDescription = uiProjectDescription();

    var _project;
    var _activeTab = 0;

    var taskingTabs = [{ 'tab': 'information'}, { 'tab': 'description'}];


    function projectTabs(selection) {

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
                projectTabs(selection);
            });

        tabsEnter
            .append('span')
            .text(function (d) { return t('tasking.project.tabs.' + d.tab + '.title'); });

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


        // add information tab
        sectionsList.selectAll('.section-tab-information')
            .call(projectInformation.project(_project));

        // add description tab
        sectionsList.selectAll('.section-tab-description')
            .call(projectDescription.project(_project));

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


    function taskingProjectDetails(selection) {
        var details = selection.selectAll('.project-details')
            .data(_project ? [_project] : [], function(d) { return d.uid(); });

        // exit
        details.exit()
            .remove();

        // enter
        var detailsEnter = details.enter()
            .append('div')
            .attr('class', 'project-details');

        detailsEnter
            .append('div')
            .attr('class', 'project-status');


        details = detailsEnter
            .merge(details);

        details
            .call(projectTabs);

        details.select('.project-status')
            .text(function(d) {
                return t('tasking.project.status', { status:
                    function() {
                        var status = 'tasking.project.statuses.' + d.status;
                        return t(status);
                    }()
                });
            });
    }


    taskingProjectDetails.project = function(val) {
        if (!arguments.length) return _project;
        _project = val;

        return this;
    };


    return taskingProjectDetails;
}

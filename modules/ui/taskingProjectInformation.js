import { t } from '../util/locale';

export function uiProjectInformation() {
    var _project;


    function projectInformation(selection) {
        if (!_project) return;

        var description = selection.selectAll('.project-information-container')
            .data([0]);

        description = description.enter()
            .append('div')
            .attr('class', 'project-information-container')
            .merge(description);

        description
            .append('h3')
            .attr('class', 'perTaskInstructions-header')
            .text(t('tasking.project.tabs.information.priority'));

        description
            .append('p')
            .attr('class', 'project-priority')
            .text(t('tasking.project.priorities.' + _project.priority ));
    }


    projectInformation.project = function(val) {
        if (!arguments.length) return _project;
        _project = val;
        return projectInformation;
    };


    return projectInformation;
}

import { t } from '../util/locale';


export function uiProjectDescription() {
    var _project;


    function projectDescription(selection) {
        if (!_project) return;

        var description = selection.selectAll('.project-description-container')
            .data([0]);

        description = description.enter()
            .append('div')
            .attr('class', 'project-description-container')
            .merge(description);

        description
            .append('p')
            .attr('class', 'project-description')
            .text(_project.description);
    }


    projectDescription.project = function(val) {
        if (!arguments.length) return _project;
        _project = val;
        return projectDescription;
    };


    return projectDescription;
}

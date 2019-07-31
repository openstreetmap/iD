import { t } from '../util/locale';
import { svgIcon } from '../svg/icon';


export function uiTaskingProjectHeader() {
    var _project;


    function taskingProjectHeader(selection) {
        var header = selection.selectAll('.project-header')
            .data(
                (_project && _project.properties ? [_project] : [0]),
                function(d) { return d.__featurehash__; }
            );

        // exit
        header.exit()
            .remove();

        // enter
        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'project-header');

        var iconEnter = headerEnter
            .append('div')
            .attr('class', 'project-header-icon');

        iconEnter
            .append('div')
            .attr('class', 'preset-icon-28')
            .call(svgIcon('#iD-icon-tasking', 'note-fill'));

        headerEnter
            .append('div')
            .attr('class', 'project-header-label');

        header = headerEnter
            .merge(header);


        header.select('.project-header-label')
            .text(function(d) {
                return _project && _project.properties ?
                    function() {
                        return t('tasking.project.id', { projectId: d.properties.projectId });
                    }() :
                    t('tasking.project.no_project.message');
            });
    }


    taskingProjectHeader.project = function(val) {
        if (!arguments.length) return _project;
        _project = val;
        return this;
    };


    return taskingProjectHeader;
}

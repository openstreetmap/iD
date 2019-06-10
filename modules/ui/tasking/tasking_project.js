import { t } from '../../util/locale';
import { svgIcon } from '../../svg/icon';


export function uiTaskingProject() {

    var _project;


    function project(selection) {
        var project = selection.selectAll('.project')
            .data(
                (_project ? [_project] : []),
                function(d) {
                    console.log('project d: ', d);
                    return d.id;
                }
            );

            project.exit()
            .remove();

        var projectEnter = project.enter()
            .append('div')
            .attr('class', 'project');

        var iconEnter = projectEnter
            .append('div')
            .attr('class', function(d) { return 'note-header-icon ' + d.status; })
            .classed('new', function(d) { return d.id < 0; });

        // iconEnter
        //     .append('div')
        //     .attr('class', 'preset-icon-28')
        //     .call(svgIcon('#iD-icon-note', 'note-fill'));

        // iconEnter.each(function(d) {
        //     var statusIcon = '#iD-icon-' + (d.id < 0 ? 'plus' : (d.status === 'open' ? 'close' : 'apply'));
        //     iconEnter
        //         .append('div')
        //         .attr('class', 'note-icon-annotation')
        //         .call(svgIcon(statusIcon, 'icon-annotation'));
        // });

        // headerEnter
        //     .append('div')
        //     .attr('class', 'note-header-label')
        //     .text(function(d) {
        //         if (_project.isNew()) { return t('note.new'); }
        //         return t('note.note') + ' ' + d.id + ' ' +
        //             (d.status === 'closed' ? t('note.closed') : '');
        //     });
    }


    project.project = function(val) {
        if (!arguments.length) return _project;
        _project = val;
        return project;
    };


    return project;
}

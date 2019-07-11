import { t } from '../util/locale';
import { svgIcon } from '../svg/icon';


export function uiTaskingTaskHeader() {
    var _datum;


    function taskingTaskHeader(selection) {
        var header = selection.selectAll('.task-header')
            .data(
                (_datum && _datum.properties ? [_datum] : [0]),
                function(d) { return d.__featurehash__; }
            );

        // exit
        header.exit()
            .remove();

        // enter
        var headerEnter = header.enter()
            .append('div')
            .attr('class', 'task-header');

        var iconEnter = headerEnter
            .append('div')
            .attr('class', 'task-header-icon');

        iconEnter
            .append('div')
            .attr('class', 'preset-icon-28')
            .call(svgIcon('#iD-icon-tasking', 'note-fill'));

        headerEnter
            .append('div')
            .attr('class', 'task-header-label');

        header = headerEnter
            .merge(header);


        header.select('.task-header-label')
            .text(function(d) {
                return _datum && _datum.properties ?
                    function() {
                        return t('tasking.task.id', { taskId: d.properties.taskId });
                    }() :
                    t('tasking.task.no_task.message');
            });
    }


    taskingTaskHeader.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return taskingTaskHeader;
}

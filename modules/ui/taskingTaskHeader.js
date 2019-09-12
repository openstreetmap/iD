import { t } from '../util/locale';
import { svgIcon } from '../svg/icon';


export function uiTaskingTaskHeader() {
    var _task;


    function taskingTaskHeader(selection) {
        var header = selection.selectAll('.task-header')
            .data(_task ? [_task] : [0], function(d) { return d.uid && d.uid(); });

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
                return _task ?
                    function() {
                        return t('tasking.task.id', { taskId: d.id });
                    }() :
                    t('tasking.task.no_task.message');
            });
    }


    taskingTaskHeader.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;
        return this;
    };


    return taskingTaskHeader;
}

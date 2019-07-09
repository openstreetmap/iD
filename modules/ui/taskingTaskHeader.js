import { t } from '../util/locale';
import { svgIcon } from '../svg/icon';


export function uiTaskingTaskHeader() {
    var _datum;


    function taskingTaskHeader(selection) {
        var header = selection.selectAll('.task-header')
            .data(
                (_datum ? [_datum] : []),
                function(d) { return d.__featurehash__; }
            );

        header.exit()
            .remove();

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
            .attr('class', 'task-header-label')
            .text(t('tasking.task.id'), { taskId: function(d) { return d.taskId || 0 ; } });
    }


    taskingTaskHeader.datum = function(val) {
        if (!arguments.length) return _datum;
        _datum = val;
        return this;
    };


    return taskingTaskHeader;
}

import { t } from '../../util/locale';
import { svgIcon } from '../../svg/icon';


export function uiTaskingTask() {

    var _task;


    function task(selection) {
        var task = selection.selectAll('.task')
            .data(
                (_task ? [_task] : []),
                function(d) { return d.id; }
            );

        // TODO: add contents for task
    }


    task.task = function(val) {
        if (!arguments.length) return _task;
        _task = val;
        return task;
    };


    return task;
}
